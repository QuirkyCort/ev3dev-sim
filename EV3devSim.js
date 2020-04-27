/* exported EV3devSim */

function EV3devSim (id) {
  var self = this;

  const WIDTH = 2362;
  const HEIGHT = 1143;

  const WHEEL_WIDTH = 20;
  const SENSOR_WIDTH = 30;
  const SENSOR_DIAMETER = 20;

  const ULTRASONIC_RANGE = 2550;

  var ULTRASONIC_RAYS = [-21, -14, -7, 0, 7, 14, 21];
  for (let i=0; i<ULTRASONIC_RAYS.length; i++) {
    ULTRASONIC_RAYS[i] = ULTRASONIC_RAYS[i] / 180 * Math.PI;
  }
  const ULTRASONIC_INCIDENT_LOWER_LIMITS = 40 / 180 * Math.PI;
  const ULTRASONIC_INCIDENT_UPPER_LIMITS = 140 / 180 * Math.PI;

  const WALLS = [
    [[0, 0],      [WIDTH, 0]],
    [[0, 0],      [0, HEIGHT]],
    [[0, HEIGHT], [WIDTH, HEIGHT]],
    [[WIDTH, 0],  [WIDTH, HEIGHT]]
  ];

  self.obstacles = [];

  self.fps = 30;
  self.clock = 0;
  self.timer = null;
  self.wallsPresent = true;
  self.obstaclesPresent = true;
  self.drawUltrasonic = false;

  self.measurePts = [null, null];

  // Create the canvas and load into provided element
  this.loadCanvas = function(id) {
    self.background = document.createElement('canvas');
    self.obstaclesLayer = document.createElement('canvas');
    self.foreground = document.createElement('canvas');
    self.measurementLayer = document.createElement('canvas');

    self.background.setAttribute('id', 'background');
    self.obstaclesLayer.setAttribute('id', 'obstaclesLayer');
    self.foreground.setAttribute('id', 'foreground');
    self.measurementLayer.setAttribute('id', 'measurementLayer');

    self.background.width = WIDTH;
    self.background.height = HEIGHT;
    self.obstaclesLayer.width = WIDTH;
    self.obstaclesLayer.height = HEIGHT;
    self.foreground.width = WIDTH;
    self.foreground.height = HEIGHT;
    self.measurementLayer.width = WIDTH;
    self.measurementLayer.height = HEIGHT;

    self.background.style.position = 'absolute';
    self.background.style.transform = 'scale(0.5)';
    self.background.style.transformOrigin = '0 0';

    self.obstaclesLayer.style.position = 'absolute';
    self.obstaclesLayer.style.transform = 'scale(0.5)';
    self.obstaclesLayer.style.transformOrigin = '0 0';

    self.foreground.style.position = 'absolute';
    self.foreground.style.transform = 'scale(0.5)';
    self.foreground.style.transformOrigin = '0 0';

    self.measurementLayer.style.position = 'absolute';
    self.measurementLayer.style.transform = 'scale(0.5)';
    self.measurementLayer.style.transformOrigin = '0 0';
    self.measurementLayer.style.cursor = 'crosshair';

    self.backgroundCtx = self.background.getContext('2d');

    self.obstaclesLayerCtx = self.obstaclesLayer.getContext('2d');
    self.obstaclesLayerCtx.translate(0, HEIGHT);
    self.obstaclesLayerCtx.scale(1, -1);

    self.foregroundCtx = self.foreground.getContext('2d');
    self.foregroundCtx.translate(0, HEIGHT);
    self.foregroundCtx.scale(1, -1);

    self.measurementLayerCtx = self.measurementLayer.getContext('2d');

    self.parent = document.getElementById(id);
    self.parent.appendChild(self.background);
    self.parent.appendChild(self.obstaclesLayer);
    self.parent.appendChild(self.foreground);
    self.parent.appendChild(self.measurementLayer);
    self.parent.style.width = WIDTH / 2;
    self.parent.style.height = HEIGHT / 2;

    self.measurementLayer.addEventListener('click', self.measurementClick);
    self.measurementLayer.addEventListener('mousemove', self.measurementMove);
  };

  this.measurementClick = function(e) {
    var x = (e.pageX - this.offsetLeft) * 2;
    var y = (e.pageY - this.offsetTop) * 2;

    if (self.measurePts[0] == null) {
      self.measurePts[0] = [x, y];
    } else if (self.measurePts[1] == null) {
      self.measurePts[1] = [x, y];
      self.clearMeasurementLayer();
      self.drawMeasurementLayer(self.measurePts[0], [x, y]);
    } else {
      self.measurePts = [null, null];
      self.clearMeasurementLayer();
    }
  };

  this.measurementMove = function(e) {
    var x = (e.pageX - this.offsetLeft) * 2;
    var y = (e.pageY - this.offsetTop) * 2;

    if (self.measurePts[0] != null && self.measurePts[1] == null) {
      self.clearMeasurementLayer();
      self.drawMeasurementLayer(self.measurePts[0], [x, y]);
    }
  };

  this.clearMeasurementLayer = function() {
    self.measurementLayerCtx.clearRect(0, 0, WIDTH, HEIGHT);
  };

  this.drawMeasurementLayer = function(pt1, pt2) {
    var dx = pt2[0] - pt1[0];
    var dy = pt2[1] - pt1[1];
    var dist = (dx ** 2 + dy ** 2) ** 0.5;

    var angle = Math.atan(-dy / dx) / Math.PI * 180;
    if (dx < 0) {
      angle = 180 + angle;
    } else if (-dy < 0) {
      angle = 360 + angle;
    }

    self.measurementLayerCtx.save();
    self.measurementLayerCtx.strokeStyle = 'white';
    self.measurementLayerCtx.lineWidth = 4;
    self.measurementLayerCtx.beginPath();
    self.measurementLayerCtx.moveTo(...pt1);
    self.measurementLayerCtx.lineTo(...pt2);
    self.measurementLayerCtx.stroke();
    self.measurementLayerCtx.strokeStyle = 'black';
    self.measurementLayerCtx.lineWidth = 2;
    self.measurementLayerCtx.beginPath();
    self.measurementLayerCtx.moveTo(...pt1);
    self.measurementLayerCtx.lineTo(...pt2);
    self.measurementLayerCtx.stroke();
    var textHeight = 28;
    self.measurementLayerCtx.font = textHeight + 'px sans-serif';

    var textX, textY;
    var text = Math.round(dist) + 'mm ' + Math.round(angle) + '\xB0';
    var textWidth = self.measurementLayerCtx.measureText(text).width;

    if (pt2[0] > WIDTH / 2) {
      textX = pt2[0] - textWidth - 10;
    } else {
      textX = pt2[0] + 10;
    }
    if (pt2[1] > HEIGHT / 2) {
      textY = pt2[1] - 10;
    } else {
      textY = pt2[1] + textHeight + 10;
    }
    self.measurementLayerCtx.fillStyle = 'rgba(255,255,255,0.5)';
    self.measurementLayerCtx.fillRect(textX - 4, textY - textHeight, textWidth + 8, textHeight + 4);
    self.measurementLayerCtx.fillStyle = 'black';
    self.measurementLayerCtx.fillText(text, textX, textY);
    self.measurementLayerCtx.restore();
  };

  this.setWallsPresent = function(value) {
    if (value) {
      self.parent.style.border = 'solid 4px black';
      self.wallsPresent = true;
    } else {
      self.parent.style.border = 'solid 4px #fafafa';
      self.wallsPresent = false;
    }
  };

  // Set the background
  this.loadBackground = function(imgURL) {
    var img = new Image();   // Create new img element
    img.addEventListener('load', function() {
      self.backgroundCtx.drawImage(img, 0, 0);
    }, false);
    img.src = imgURL;
  };

  // Clear the background
  this.clearBackground = function() {
    self.backgroundCtx.save();
    self.backgroundCtx.fillStyle = 'white';
    self.backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT);
    self.backgroundCtx.restore();
  };

  // Get robot acceleration
  this.getAcceleration = function() {
    var weight;

    if (typeof self.robotSpecs.weight == 'undefined' || self.robotSpecs.weight === null || self.robotSpecs.weight === '') {
      weight = 6;
    } else if (self.robotSpecs.weight == 'weightless') {
      weight = 0;
    } else if (self.robotSpecs.weight == 'light') {
      weight = 3;
    } else if (self.robotSpecs.weight == 'medium') {
      weight = 6;
    } else if (self.robotSpecs.weight == 'heavy') {
      weight = 9;
    } else {
      weight = self.robotSpecs.weight;
    }

    return 5000 / weight / self.fps;
  };

  // Create robot on off-screen canvas
  this.loadRobot = function(robotSpecs) {
    // Load default robot specs if not provided
    if (typeof robotSpecs === 'undefined') {
      robotSpecs = {
        wheeldiameter: 56,
        wheelSpacing: 180,
        back: -120,
        weight: 'weightless',
        sensor1: {
          x: -20,
          y: 30
        },
        sensor2: {
          x: 20,
          y: 30
        },
        ultrasonic: {
          x: 0,
          y: 20,
          angle: 0
        }
      };
    }
    self.robotSpecs = robotSpecs;

    // Initialize robot states
    self.robotStates = {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      angle: 0,
      leftWheel: {
        polarity: 'normal',
        pos: 0,
        time_sp: 0,
        position_sp: 0,
        speed_sp: 0,
        speed: 0,
        command: '',
        state: ''
      },
      rightWheel: {
        polarity: 'normal',
        pos: 0,
        time_sp: 0,
        position_sp: 0,
        speed_sp: 0,
        speed: 0,
        command: '',
        state: ''
      },
      sensor1: [0,0,0],
      sensor2: [0,0,0],
      gyro: [0,0], // angle, rate
      ultrasonic: 0
    };

    var RIGHT_LIMIT = robotSpecs.wheelSpacing / 2 + WHEEL_WIDTH / 2;
    var LEFT_LIMIT = -robotSpecs.wheelSpacing / 2 - WHEEL_WIDTH / 2;
    var TOP_LIMIT = robotSpecs.wheeldiameter / 2;
    var BOTTOM_LIMIT = -robotSpecs.wheeldiameter / 2;

    if (typeof robotSpecs.sensor1 !== 'undefined') {
      RIGHT_LIMIT = Math.max(RIGHT_LIMIT, robotSpecs.sensor1.x + SENSOR_WIDTH / 2);
      LEFT_LIMIT = Math.min(LEFT_LIMIT, robotSpecs.sensor1.x - SENSOR_WIDTH / 2);
      TOP_LIMIT = Math.max(TOP_LIMIT, robotSpecs.sensor1.y + SENSOR_WIDTH / 2);
      BOTTOM_LIMIT = Math.min(BOTTOM_LIMIT, robotSpecs.sensor1.y - SENSOR_WIDTH / 2);
    }
    if (typeof robotSpecs.sensor2 !== 'undefined') {
      RIGHT_LIMIT = Math.max(RIGHT_LIMIT, robotSpecs.sensor2.x + SENSOR_WIDTH / 2);
      LEFT_LIMIT = Math.min(LEFT_LIMIT, robotSpecs.sensor2.x - SENSOR_WIDTH / 2);
      TOP_LIMIT = Math.max(TOP_LIMIT, robotSpecs.sensor2.y + SENSOR_WIDTH / 2);
      BOTTOM_LIMIT = Math.min(BOTTOM_LIMIT, robotSpecs.sensor2.y - SENSOR_WIDTH / 2);
    }
    if (typeof robotSpecs.back !== 'undefined') {
      BOTTOM_LIMIT = Math.min(BOTTOM_LIMIT, robotSpecs.back);
    }

    var width = RIGHT_LIMIT - LEFT_LIMIT;
    var height = TOP_LIMIT - BOTTOM_LIMIT;

    self.robotCanvas = document.createElement('canvas');
    self.robotCanvas.width = width;
    self.robotCanvas.height = height;
    var ctx = self.robotCanvas.getContext('2d');

    // Robot Body
    ctx.fillStyle = 'orange';
    ctx.fillRect(0, 0, self.robotCanvas.width, self.robotCanvas.height); // bounding box

    // Find origin
    self.ROBOT_X_CENTER = -LEFT_LIMIT;
    self.ROBOT_Y_CENTER = -BOTTOM_LIMIT;

    // Draw wheels
    ctx.fillStyle = 'black';
    ctx.fillRect(
      self.ROBOT_X_CENTER - (robotSpecs.wheelSpacing / 2) - (WHEEL_WIDTH / 2),
      self.ROBOT_Y_CENTER - (robotSpecs.wheeldiameter / 2),
      WHEEL_WIDTH,
      robotSpecs.wheeldiameter
    );
    ctx.fillRect(
      self.ROBOT_X_CENTER + (robotSpecs.wheelSpacing / 2) - (WHEEL_WIDTH / 2),
      self.ROBOT_Y_CENTER - (robotSpecs.wheeldiameter / 2),
      WHEEL_WIDTH,
      robotSpecs.wheeldiameter
    );

    // Draw sensors
    ctx.fillStyle = 'gray';
    ctx.fillRect(
      self.ROBOT_X_CENTER + robotSpecs.sensor1.x - (SENSOR_WIDTH / 2),
      self.ROBOT_Y_CENTER + robotSpecs.sensor1.y - (SENSOR_WIDTH / 2),
      SENSOR_WIDTH,
      SENSOR_WIDTH
    );
    if (typeof robotSpecs.sensor2 != 'undefined') {
      ctx.fillRect(
        self.ROBOT_X_CENTER + robotSpecs.sensor2.x - (SENSOR_WIDTH / 2),
        self.ROBOT_Y_CENTER + robotSpecs.sensor2.y - (SENSOR_WIDTH / 2),
        SENSOR_WIDTH,
        SENSOR_WIDTH
      );
    }

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(
      self.ROBOT_X_CENTER + robotSpecs.sensor1.x,
      self.ROBOT_Y_CENTER + robotSpecs.sensor1.y,
      SENSOR_DIAMETER / 2,
      0, 2 * Math.PI
    );
    ctx.fill();
    ctx.stroke();

    if (typeof robotSpecs.sensor2 != 'undefined') {
      ctx.beginPath();
      ctx.arc(
        self.ROBOT_X_CENTER + robotSpecs.sensor2.x,
        self.ROBOT_Y_CENTER + robotSpecs.sensor2.y,
        SENSOR_DIAMETER / 2,
        0, 2 * Math.PI
      );
      ctx.fill();
      ctx.stroke();
    }
  };

  this.setRobotPos = function(x, y, angle) {
    self.robotStates.x = x;
    self.robotStates.y = y;
    self.robotStates.angle = angle;
  };

  this.resetWheel = function(side) {
    var wheel;

    if (side == 'left') {
      wheel = self.robotStates.leftWheel;
    } else if (side == 'right') {
      wheel = self.robotStates.rightWheel;
    }

    wheel.pos = 0;
    wheel.speed_sp = 0;
    wheel.position_sp = 0;
    wheel.time_sp = 0;
    wheel.speed = 0;
    wheel.state = '';
    wheel.polarity = 'normal';
  };

  this.reset = function() {
    self.resetWheel('left');
    self.resetWheel('right');
    self.getColorSensorsValues();
    self.calcUltrasonic();
    self.robotStates.gyro = [0,0];
  };

  this.calcWheelDist = function(wheel) {
    var period = 1 / self.fps;
    var dist = 0;
    var degrees = wheel.speed * period;

    if (
      wheel.command == 'run-forever'
      || (wheel.command == 'run-timed' && self.clock < wheel.time_target)
    ) {
      dist = (degrees / 360) * (self.robotSpecs.wheeldiameter * Math.PI);
      wheel.pos += degrees;

    } else if (
      wheel.command == 'run-to-rel-pos'
      || wheel.command == 'run-to-abs-pos'
    ) {
      if (wheel.position_sp < 0) {
        degrees = -degrees;
      }
      wheel.pos += degrees;

      dist = (degrees / 360) * (self.robotSpecs.wheeldiameter * Math.PI);
      if (
        (wheel.position_sp >= 0 && wheel.pos > wheel.position_target)
        || (wheel.position_sp < 0 && wheel.pos < wheel.position_target)
      ) {
        wheel.state = '';
        return 0;
      }

    } else {
      wheel.state = '';
      return 0;
    }

    if (wheel.polarity == 'inversed') {
      return -dist;
    } else {
      return dist;
    }
  };

  this.setWheelSpeed = function(wheel) {
    if (wheel.speed < wheel.speed_sp) {
      wheel.speed += self.getAcceleration();
      if (wheel.speed > wheel.speed_sp) {
        wheel.speed = wheel.speed_sp;
      }
    } else if (wheel.speed > wheel.speed_sp) {
      wheel.speed -= self.getAcceleration();
      if (wheel.speed < wheel.speed_sp) {
        wheel.speed = wheel.speed_sp;
      }
    }
  };

  this.animate = function() {
    self.clock++;

    self.setWheelSpeed(self.robotStates.leftWheel);
    self.setWheelSpeed(self.robotStates.rightWheel);

    var left_dist = self.calcWheelDist(self.robotStates.leftWheel);
    var right_dist = self.calcWheelDist(self.robotStates.rightWheel);

    var delta_x = (left_dist + right_dist) / 2 * Math.cos(self.robotStates.angle);
    var delta_y = (left_dist + right_dist) / 2 * Math.sin(self.robotStates.angle);
    var delta_angle = (right_dist - left_dist) / self.robotSpecs.wheelSpacing;

    self.robotStates.gyro[0] -= delta_angle / Math.PI * 180;
    self.robotStates.gyro[1] = - delta_angle * self.fps / Math.PI * 180;

    self.robotStates.x += delta_x;
    self.robotStates.y += delta_y;
    self.robotStates.angle += delta_angle;
    if (self.robotStates.angle > Math.PI * 2) {
      self.robotStates.angle -= Math.PI * 2;
    }

    self.drawAll();
    self.getColorSensorsValues();
  };

  this.drawAll = function() {
    self.clearForeground();
    self.drawRobot();
    self.calcUltrasonic();
  };

  this.clearForeground = function() {
    self.foregroundCtx.clearRect(0, 0, WIDTH, HEIGHT);
  };

  this.calcUltrasonic = function() {
    var dists = [];
    var offsetAngle = self.robotSpecs.ultrasonic.angle / 180 * Math.PI;
    var primaryAngle = self.robotStates.angle + offsetAngle;
    var cos = Math.cos(self.robotStates.angle - Math.PI / 2);
    var sin = Math.sin(self.robotStates.angle - Math.PI / 2);

    var x = cos * self.robotSpecs.ultrasonic.x - sin * self.robotSpecs.ultrasonic.y + self.robotStates.x;
    var y = sin * self.robotSpecs.ultrasonic.x + cos * self.robotSpecs.ultrasonic.y + self.robotStates.y;

    self.foregroundCtx.save();
    self.foregroundCtx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    self.foregroundCtx.beginPath();
    for (let a of ULTRASONIC_RAYS) {
      var lineEnd = [
        x + ULTRASONIC_RANGE * Math.cos(primaryAngle + a),
        y + ULTRASONIC_RANGE * Math.sin(primaryAngle + a)
      ];
      let ultrasonicRay = [[x, y], lineEnd];

      if (self.clock % 3 == 0) { // simulate slow update rate of ultrasonic sensors
        if (self.wallsPresent) {
          for (let wall of WALLS) {
            let intercept = self.calcIntercept(ultrasonicRay, wall);
            if (intercept != null) {
              let incidentAngle = self.incidentAngle(wall, primaryAngle);
              if (incidentAngle > ULTRASONIC_INCIDENT_LOWER_LIMITS && incidentAngle < ULTRASONIC_INCIDENT_UPPER_LIMITS) {
                dists.push(self.calcDist([x, y], intercept));
              }
            }
          }
        }

        if (self.obstaclesPresent) {
          for (let obstacle of self.obstacles) {
            for (let wall of self.obstacleToLines(obstacle)) {
              let intercept = self.calcIntercept(ultrasonicRay, wall);
              if (intercept != null) {
                let incidentAngle = self.incidentAngle(wall, primaryAngle);
                if (incidentAngle > ULTRASONIC_INCIDENT_LOWER_LIMITS && incidentAngle < ULTRASONIC_INCIDENT_UPPER_LIMITS) {
                  dists.push(self.calcDist([x, y], intercept));
                }
              }
            }
          }
        }
      }

      if (self.drawUltrasonic) {
        self.foregroundCtx.moveTo(x, y);
        self.foregroundCtx.lineTo(...lineEnd);
      }
    }

    if (self.clock % 3 == 0) {
      let minDist = Math.min(...dists);
      if (minDist == Infinity) {
        self.robotStates.ultrasonic = ULTRASONIC_RANGE;
      } else {
        self.robotStates.ultrasonic = minDist;
      }
    }
    self.foregroundCtx.stroke();
    self.foregroundCtx.restore();
  };

  this.incidentAngle = function(line, angle) {
    let lineAngle;
    if (line[0][0] == line[1][0]) {
      lineAngle = Math.PI / 2;
    } else {
      lineAngle = Math.atan((line[1][1] - line[0][1]) / (line[1][0] - line[0][0]));
    }
    let incidentAngle = lineAngle - angle;
    if (incidentAngle < 0) {
      incidentAngle = -incidentAngle;
    }
    if (incidentAngle > Math.PI) {
      incidentAngle = 2 * Math.PI - incidentAngle;
    }
    return incidentAngle;
  };

  this.calcDist = function(p1, p2) {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return (dx**2 + dy**2)**0.5;
  };

  this.calcIntercept = function(l1, l2) {
    let denominator = (l1[0][0] - l1[1][0]) * (l2[0][1] - l2[1][1]) - (l1[0][1] -l1[1][1]) * (l2[0][0] - l2[1][0]);

    if (denominator == 0) {
      return null;
    }

    let x1y2y1x2 = l1[0][0]*l1[1][1] - l1[0][1]*l1[1][0];
    let x3y4y3x4 = l2[0][0]*l2[1][1] - l2[0][1]*l2[1][0];

    let x = (x1y2y1x2 * (l2[0][0] - l2[1][0]) - (l1[0][0] - l1[1][0]) * x3y4y3x4) / denominator;
    if (
      (x - 0.01 > l1[0][0] && x - 0.01 > l1[1][0])
      || (x + 0.01 < l1[0][0] && x + 0.01 < l1[1][0])
      || (x - 0.01 > l2[0][0] && x - 0.01 > l2[1][0])
      || (x + 0.01 < l2[0][0] && x + 0.01 < l2[1][0])
    ) {
      return null;
    }

    let y = (x1y2y1x2 * (l2[0][1] - l2[1][1]) - (l1[0][1] - l1[1][1]) * x3y4y3x4) / denominator;
    if (
      (y - 0.01 > l1[0][1] && y - 0.01 > l1[1][1])
      || (y + 0.01 < l1[0][1] && y + 0.01 < l1[1][1])
      || (y - 0.01 > l2[0][1] && y - 0.01 > l2[1][1])
      || (y + 0.01 < l2[0][1] && y + 0.01 < l2[1][1])
    ) {
      return null;
    }

    return [x, y];
  };

  this.loadObstacles = function(obstacles) {
    self.clearObstacles();
    self.obstacles = obstacles;
    self.clearObstaclesLayer();
    self.drawObstacles();
  };

  this.clearObstacles = function() {
    self.obstacles = [];
  };

  this.obstacleToLines = function(obstacle) {
    let p1 = [obstacle[0],               obstacle[1]];
    let p2 = [obstacle[0] + obstacle[2], obstacle[1]];
    let p3 = [obstacle[0],               obstacle[1] + obstacle[3]];
    let p4 = [obstacle[0] + obstacle[2], obstacle[1] + obstacle[3]];

    let lines = [
      [p1, p2],
      [p1, p3],
      [p2, p4],
      [p3, p4]
    ];

    return lines;
  };

  this.startAnimation = function() {
    if (self.timer == null) {
      console.log('start animation');
      self.clock = 0;
      self.timer = setInterval(self.animate, 1000 / self.fps);
    }
  };

  this.stopAnimation = function() {
    console.log('stop animation');
    clearInterval(self.timer);
    self.timer = null;
  };

  this.drawRobot = function() {
    self.foregroundCtx.save();
    self.foregroundCtx.translate(self.robotStates.x, self.robotStates.y);
    self.foregroundCtx.rotate(self.robotStates.angle - Math.PI / 2);
    self.foregroundCtx.drawImage(
      self.robotCanvas,
      -self.ROBOT_X_CENTER,
      -self.ROBOT_Y_CENTER
    );
    self.foregroundCtx.restore();
  };

  this.drawObstacles = function() {
    self.obstaclesLayerCtx.fillStyle = 'Magenta';
    self.obstaclesLayerCtx.strokeStyle = 'purple';
    self.obstaclesLayerCtx.lineWidth = 8;
    for (let obstacle of self.obstacles) {
      self.obstaclesLayerCtx.fillRect(...obstacle);
      self.obstaclesLayerCtx.strokeRect(...obstacle);
    }
  };

  this.clearObstaclesLayer = function() {
    self.obstaclesLayerCtx.clearRect(0, 0, WIDTH, HEIGHT);
  };

  this.getColorSensorsValues = function() {
    var cos = Math.cos(self.robotStates.angle - Math.PI / 2);
    var sin = Math.sin(self.robotStates.angle - Math.PI / 2);

    var x1 = cos * self.robotSpecs.sensor1.x - sin * self.robotSpecs.sensor1.y + self.robotStates.x;
    var y1 = -(sin * self.robotSpecs.sensor1.x + cos * self.robotSpecs.sensor1.y) + (HEIGHT - self.robotStates.y);
    self.robotStates.sensor1 = self.getSensorValues(x1, y1);

    if (typeof self.robotSpecs.sensor2 != 'undefined') {
      var x2 = cos * self.robotSpecs.sensor2.x - sin * self.robotSpecs.sensor2.y + self.robotStates.x;
      var y2 = -(sin * self.robotSpecs.sensor2.x + cos * self.robotSpecs.sensor2.y) + (HEIGHT - self.robotStates.y);
      self.robotStates.sensor2 = self.getSensorValues(x2, y2);
    }
  };

  this.getSensorValues = function(x, y) {
    var sensorBox = self.backgroundCtx.getImageData(
      x - SENSOR_DIAMETER / 2,
      y - SENSOR_DIAMETER / 2,
      SENSOR_DIAMETER,
      SENSOR_DIAMETER
    );

    var redTotal = 0;
    var greenTotal = 0;
    var blueTotal = 0;
    var count = 0;
    var radius = SENSOR_DIAMETER / 2;
    var radiusSquare = radius ** 2;
    for (let row = 0; row < SENSOR_DIAMETER; row++) {
      for (let col = 0; col < SENSOR_DIAMETER; col++) {
        if (((row - radius)**2 + (col - radius)**2) < radiusSquare) {
          let offset = row * (SENSOR_DIAMETER * 4) + col * 4;
          count++;
          redTotal += sensorBox.data[offset];
          greenTotal += sensorBox.data[offset + 1];
          blueTotal += sensorBox.data[offset + 2];
        }
      }
    }

    return [redTotal / count, greenTotal / count, blueTotal / count];
  };

  self.loadCanvas(id);
  self.setWallsPresent(true);
  self.clearBackground();
  self.loadRobot();
  self.drawRobot();
  self.drawObstacles();
}