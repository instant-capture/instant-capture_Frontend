#define TRIG 9
#define ECHO 10
#define LED 13
#define BUZZER 8

#define ZONE_SIZE 10
#define INITIAL_TIME 1200
#define MIN_TIME 400
#define TIME_STEP 100
#define MIN_PLAYER_COUNT 5

enum State {
  CALIB_EMPTY,
  CALIB_PLAYER,
  GAME_READY,
  GAME_WAIT,
  GAME_PLAY,
  GAME_RESULT
};

State gameState = CALIB_EMPTY;
byte level = 1;
int timeLimit = INITIAL_TIME;
float basePos = 0, minPos = 0, maxPos = 0;

unsigned long startTime, fireTime, reactionTime;
byte playerDetectCount;
bool wasInZone, escaped;
byte calibStep = 0;

unsigned long lastDistSend = 0;

// =====================================================================
// 거리 측정
// =====================================================================
float measureDistance() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  long duration = pulseIn(ECHO, HIGH, 30000);
  if (duration == 0)
    return -1;

  float dist = duration * 0.034 / 2;
  if (dist < 5 || dist > 400)
    return -1;
  return dist;
}

bool measureAverage(byte samples, float &result) {
  float sum = 0;
  byte count = 0;
  for (byte i = 0; i < samples * 2 && count < samples; i++) {
    float d = measureDistance();
    if (d > 0) {
      sum += d;
      count++;
    }
    delay(80);
  }
  if (count < samples / 2)
    return false;
  result = sum / count;
  return true;
}

// =====================================================================
// 사운드
// =====================================================================
void playSound(int freq, int dur) { tone(BUZZER, freq, dur); }
void playSuccess() {
  playSound(1200, 80);
  delay(100);
  playSound(1600, 80);
  delay(100);
  playSound(2000, 80);
}
void playFail() { playSound(400, 300); }

// =====================================================================
// JSON 출력
// =====================================================================
void sendDistance(float dist) {
  Serial.print("{\"type\":\"distance\",\"dist\":");
  Serial.print(dist, 1);
  Serial.println(",\"state\":\"calib\"}");
}

void sendCalibComplete() {
  Serial.print("{\"type\":\"calib_complete\",\"basePos\":");
  Serial.print(basePos, 1);
  Serial.print(",\"minPos\":");
  Serial.print(minPos, 1);
  Serial.print(",\"maxPos\":");
  Serial.print(maxPos, 1);
  Serial.println("}");
}

void sendFire() {
  Serial.print("{\"type\":\"fire\",\"fireTime\":");
  Serial.print(fireTime);
  Serial.println("}");
}

void sendGameDistance(float dist) {
  Serial.print("{\"type\":\"distance\",\"dist\":");
  Serial.print(dist, 1);
  Serial.println(",\"state\":\"play\"}");
}

void sendEscape(unsigned long reaction) {
  Serial.print("{\"type\":\"escape\",\"reaction\":");
  Serial.print(reaction);
  Serial.println("}");
}

void sendResult(const char *result, unsigned long reaction) {
  Serial.print("{\"type\":\"result\",\"result\":\"");
  Serial.print(result);
  Serial.print("\",\"level\":");
  Serial.print(level);
  Serial.print(",\"timeLimit\":");
  Serial.print(timeLimit);
  if (reaction > 0) {
    Serial.print(",\"reaction\":");
    Serial.print(reaction);
  }
  Serial.println("}");
}

// =====================================================================
// 시리얼 명령 체크
// =====================================================================
bool checkCommand() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == 'n')
      return true;
  }
  return false;
}

// =====================================================================
// 캘리브레이션 - 빈 공간
// =====================================================================
void doCalibrateEmpty() {
  // 계속 거리 데이터 전송
  if (millis() - lastDistSend > 300) {
    float dist = measureDistance();
    if (dist > 0)
      sendDistance(dist);
    lastDistSend = millis();
  }

  // 'n' 명령 받으면 다음 단계
  if (checkCommand()) {
    float emptyDist;
    if (measureAverage(5, emptyDist)) {
      Serial.print(
          "{\"type\":\"step\",\"step\":1,\"message\":\"empty_done\",\"dist\":");
      Serial.print(emptyDist, 1);
      Serial.println("}");
    }
    gameState = CALIB_PLAYER;
  }
}

// =====================================================================
// 캘리브레이션 - 플레이어 위치
// =====================================================================
void doCalibratePlayer() {
  // 계속 거리 데이터 전송
  if (millis() - lastDistSend > 300) {
    float dist = measureDistance();
    if (dist > 0)
      sendDistance(dist);
    lastDistSend = millis();
  }

  // 'n' 명령 받으면 캘리브 완료
  if (checkCommand()) {
    if (measureAverage(5, basePos)) {
      minPos = basePos - ZONE_SIZE;
      maxPos = basePos + ZONE_SIZE;
      sendCalibComplete();
      playSuccess();
      gameState = GAME_READY;
    }
  }
}

// =====================================================================
// 게임 준비
// =====================================================================
void doGameReady() {
  Serial.print("{\"type\":\"ready\",\"level\":");
  Serial.print(level);
  Serial.print(",\"timeLimit\":");
  Serial.print(timeLimit);
  Serial.println("}");

  delay(500);
  startTime = millis();
  playerDetectCount = 0;
  wasInZone = false;
  escaped = false;
  reactionTime = 0;
  gameState = GAME_WAIT;
}

// =====================================================================
// 대기 후 발사
// =====================================================================
void doGameWait() {
  static unsigned long waitTime = 0;
  if (waitTime == 0)
    waitTime = random(1000, 3000);

  if (millis() - startTime >= waitTime) {
    digitalWrite(LED, HIGH);
    playSound(2000, 150);
    fireTime = millis();
    sendFire();
    waitTime = 0;
    gameState = GAME_PLAY;
  }
}

// =====================================================================
// 게임 플레이
// =====================================================================
void doGamePlay() {
  float dist = measureDistance();

  if (dist > 0) {
    sendGameDistance(dist);
    bool inZone = (dist >= minPos && dist <= maxPos);

    if (inZone) {
      playerDetectCount++;
      wasInZone = true;
    } else {
      if (wasInZone && !escaped) {
        escaped = true;
        reactionTime = millis() - fireTime;
        sendEscape(reactionTime);
      }
      wasInZone = false;
    }
  }

  if (millis() - fireTime >= timeLimit) {
    gameState = GAME_RESULT;
  }
  delay(20);
}

// =====================================================================
// 결과 처리
// =====================================================================
void doGameResult() {
  digitalWrite(LED, LOW);

  bool valid = (playerDetectCount >= MIN_PLAYER_COUNT);

  if (!valid) {
    sendResult("invalid", 0);
    playFail();
  } else if (escaped) {
    sendResult("success", reactionTime);
    playSuccess();
    if (timeLimit > MIN_TIME) {
      timeLimit -= TIME_STEP;
      level++;
    }
  } else {
    sendResult("fail", 0);
    playFail();
    level = 1;
    timeLimit = INITIAL_TIME;
  }

  delay(2000);
  gameState = GAME_READY;
}

// =====================================================================
// SETUP
// =====================================================================
void setup() {
  pinMode(LED, OUTPUT);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(BUZZER, OUTPUT);
  Serial.begin(9600);
  delay(200);
  randomSeed(analogRead(A0));

  // 시작 메시지
  Serial.println("{\"type\":\"init\",\"message\":\"ready\"}");
}

// =====================================================================
// LOOP
// =====================================================================
void loop() {
  switch (gameState) {
  case CALIB_EMPTY:
    doCalibrateEmpty();
    break;
  case CALIB_PLAYER:
    doCalibratePlayer();
    break;
  case GAME_READY:
    doGameReady();
    break;
  case GAME_WAIT:
    doGameWait();
    break;
  case GAME_PLAY:
    doGamePlay();
    break;
  case GAME_RESULT:
    doGameResult();
    break;
  }
}
