console.clear();

(function(window, document, THREE) {
    // "constants"...
    var WIDTH = 700,
        HEIGHT = 500,
        VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000,
        FIELD_WIDTH = 1200,
        FIELD_LENGTH = 3000,
        BALL_RADIUS = 20,
        PADDLE_WIDTH = 200,
        PADDLE_HEIGHT = 30,

        //get the scoreboard element.
        scoreBoard = document.getElementById('scoreBoard'),

        //declare members.
        container, renderer, camera, mainLight, topCamera,
        scene, ball, paddle1, paddle2, field, running,
        score = {
            player1: 0,
            player2: 0
        };


    function startBallMovement() {
        var direction = Math.random() > 0.5 ? -1 : 1;
        ball.$velocity = {
            x: 0,
            z: direction * 20
        };
        ball.$stopped = false;
    }

    function processCpuPaddle() {
        var ballPos = ball.position,
            cpuPos = paddle2.position;

        if (cpuPos.x - 100 > ballPos.x) {
            cpuPos.x -= Math.min(cpuPos.x - ballPos.x, 6);
        } else if (cpuPos.x - 100 < ballPos.x) {
            cpuPos.x += Math.min(ballPos.x - cpuPos.x, 6);
        }
    }

    function processBallMovement() {
        if (!ball.$velocity) {
            startBallMovement();
        }

        if (ball.$stopped) {
            return;
        }

        updateBallPosition();

        if (isSideCollision()) {
            ball.$velocity.x *= -1;
        }

        if (isPaddle1Collision()) {
            hitBallBack(paddle1);
        }

        if (isPaddle2Collision()) {
            hitBallBack(paddle2);
        }

        if (isPastPaddle1()) {
            scoreBy('player2');
        }

        if (isPastPaddle2()) {
            scoreBy('player1');
        }
    }

    function isPastPaddle1() {
        return ball.position.z > paddle1.position.z + 100;
    }

    function isPastPaddle2() {
        return ball.position.z < paddle2.position.z - 100;
    }

    function updateBallPosition() {
        var ballPos = ball.position;

        //update the ball's position.
        ballPos.x += ball.$velocity.x;
        ballPos.z += ball.$velocity.z;

        // add an arc to the ball's flight. Comment this out for boring, flat pong.
        //ballPos.y = -((ballPos.z - 1) * (ballPos.z - 1) / 5000) + 435;
    }

    function isSideCollision() {
        var ballX = ball.position.x,
            halfFieldWidth = FIELD_WIDTH / 2;
        return ballX - BALL_RADIUS < -halfFieldWidth || ballX + BALL_RADIUS > halfFieldWidth;
    }

    function hitBallBack(paddle) {
        ball.$velocity.x = (ball.position.x - paddle.position.x) / 5;
        ball.$velocity.z *= -1;
    }

    function isPaddle2Collision() {
        return ball.position.z - BALL_RADIUS <= paddle2.position.z &&
            isBallAlignedWithPaddle(paddle2);
    }

    function isPaddle1Collision() {
        return ball.position.z + BALL_RADIUS >= paddle1.position.z &&
            isBallAlignedWithPaddle(paddle1);
    }

    function isBallAlignedWithPaddle(paddle) {
        var halfPaddleWidth = PADDLE_WIDTH / 2,
            paddleX = paddle.position.x,
            ballX = ball.position.x;
        return ballX > paddleX - halfPaddleWidth &&
            ballX < paddleX + halfPaddleWidth;
    }

    function scoreBy(playerName) {
        addPoint(playerName);
        updateScoreBoard();
        stopBall();
        setTimeout(reset, 2000);
    }

    function updateScoreBoard() {
        scoreBoard.innerHTML = 'Player 1: ' + score.player1 + ' Player 2: ' +
            score.player2;
    }

    function stopBall() {
        ball.$stopped = true;
    }

    function addPoint(playerName) {
        score[playerName]++;
        console.log(score);
    }

    function startRender() {
        running = true;
        render();
    }

    function stopRender() {
        running = false;
    }

    function paddleControl(){
        // player 1 go left
        if(Key.isDown(65) && paddle1.position.x > -500){
            paddle1.position.x -= 10;
        }
        // player 1 go right
        if(Key.isDown(68) && paddle1.position.x < 500){
            paddle1.position.x += 10;
        }

        // player 2 go left
        if(Key.isDown(37) && paddle2.position.x < 500){
            paddle2.position.x += 10;
        }
        // player 2 go right
        if(Key.isDown(39) && paddle2.position.x > -500){
            paddle2.position.x -= 10;
        }

        // camera tracking
        topCamera.position.x = paddle2.position.x;
        camera.position.x = paddle1.position.x;
    }

    function render() {
        var SCREEN_W = 700;
        var SCREEN_H = 500;

        var left, bottom, width, height;

        left = 1;
        bottom = 1;
        width = SCREEN_W - 2;
        height = 0.5 * SCREEN_H - 2;
        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        renderer.enableScissorTest(true);
        topCamera.aspect = width / height;
        topCamera.updateProjectionMatrix();
        renderer.render(scene, topCamera);

        left = 1;
        bottom = 0.5 * SCREEN_H + 1;
        width = SCREEN_W - 2;
        height = 0.5 * SCREEN_H - 2;
        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        renderer.enableScissorTest(true); // clip out "viewport"
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);

        if (running) {

            requestAnimationFrame(render);

            processBallMovement();
            //processCpuPaddle();
            paddleControl();
        }
    }

    function reset() {
        ball.position.set(0, 0, 0);
        ball.$velocity = null;
    }

    function init() {
        container = document.getElementById('container');

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(WIDTH, HEIGHT);
        renderer.setClearColor(0x000000, 1);
        container.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        camera.position.set(0, 200, FIELD_LENGTH / 2 + 500);

        topCamera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        topCamera.position.set(0, 200, -(FIELD_LENGTH / 2 + 500));

        scene = new THREE.Scene();
        scene.add(camera);

        var fieldGeometry = new THREE.CubeGeometry(FIELD_WIDTH, 5, FIELD_LENGTH, 1, 1, 1),
        textureImage = THREE.ImageUtils.loadTexture('https://upload.wikimedia.org/wikipedia/commons/8/8c/Football_field.jpg');
        var fieldMaterial = new THREE.MeshPhongMaterial({map: textureImage});
            /*fieldMaterial = new THREE.MeshLambertMaterial({
                color: 0x0033FF
            });*/
        field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.position.set(0, -50, 0);

        scene.add(field);
        paddle1 = addPaddle(0xAA3333);
        paddle1.position.z = FIELD_LENGTH / 2;
        paddle2 = addPaddle(0x3F51B5);
        paddle2.position.z = -FIELD_LENGTH / 2;

        var ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 16, 16),
            ballMaterial = new THREE.MeshLambertMaterial({
                color: 0x0FF0FF
            });
        ball = new THREE.Mesh(ballGeometry, ballMaterial);
        scene.add(ball);

        camera.lookAt(ball.position);
        topCamera.lookAt(ball.position);

        mainLight = new THREE.HemisphereLight(0xFFFFFF, 0x003300);
        scene.add(mainLight);

        camera.lookAt(ball.position);
        topCamera.lookAt(ball.position);

        updateScoreBoard();
        startRender();

        //renderer.domElement.addEventListener('mousemove', containerMouseMove);
        renderer.domElement.style.cursor = 'none';
    }

    function addPaddle(color_paddle) {
        var paddleGeometry = new THREE.CubeGeometry(PADDLE_WIDTH, PADDLE_HEIGHT, 10, 1, 1, 1),
            paddleMaterial = new THREE.MeshLambertMaterial({
                color: color_paddle
            }),
            paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
        scene.add(paddle);
        return paddle;
    }

    /*function containerMouseMove(e) {
        var mouseX = e.clientX;
        camera.position.x = paddle1.position.x = -((WIDTH - mouseX) / WIDTH * FIELD_WIDTH) + (FIELD_WIDTH / 2);
        topCamera.position.x = paddle2.position.x;
    }*/

    init();
})(window, window.document, window.THREE);