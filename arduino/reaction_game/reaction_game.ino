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

struct {
  State state;
  byte level;
  int timeLimit;
  float basePos;
  float minPos;
  float maxPos;
} game = {CALIB_EMPTY, 1, INITIAL_TIME, 0, 0, 0};

struct {
  unsigned long startTime;
  unsigned long fireTime;
  unsigned long reactionTime;
  byte playerDetectCount;
  bool wasInZone;
  bool escaped;
} currentRound;

struct {
  byte step;
  byte validCount;
  float sum;
} calib;

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
void playSound(int freq, int duration) { tone(BUZZER, freq, duration); }

void playSuccess() {
  playSound(1200, 80);
  delay(100);
  playSound(1600, 80);
  delay(100);
  playSound(2000, 80);
}

void playFail() { playSound(400, 300); }

// =====================================================================
// 엔터 대기
// =====================================================================
void waitForEnter(const char *msg) {
  Serial.println(msg);
  Serial.println("엔터를 누르세요 >");

  while (Serial.available())
    Serial.read();
  while (!Serial.available())
    delay(10);
  while (Serial.available())
    Serial.read();
}

// =====================================================================
// JSON 직접 출력 함수
// =====================================================================
void sendJsonFire(unsigned long fireTime) {
  Serial.print("{\"type\":\"fire\",\"fireTime\":");
  Serial.print(fireTime);
  Serial.println("}");
}

void sendJsonDistance(float dist) {
  Serial.print("{\"type\":\"distance\",\"dist\":");
  Serial.print(dist);
  Serial.println(",\"state\":\"play\"}");
}

void sendJsonEscape(unsigned long reaction) {
  Serial.print("{\"type\":\"escape\",\"reaction\":");
  Serial.print(reaction);
  Serial.println("}");
}

void sendJsonResult(const char *result, byte level, int timeLimit,
                    byte detected, unsigned long reaction) {
  Serial.print("{\"type\":\"result\"");
  Serial.print(",\"result\":\"");
  Serial.print(result);
  Serial.print("\"");
  Serial.print(",\"level\":");
  Serial.print(level);
  Serial.print(",\"timeLimit\":");
  Serial.print(timeLimit);
  Serial.print(",\"playerDetected\":");
  Serial.print(detected);

  if (reaction > 0) {
    Serial.print(",\"reaction\":");
    Serial.print(reaction);
  }

  Serial.println("}");
}

// =====================================================================
// 캘리브 Empty
// =====================================================================
void doCalibrateEmpty() {
  if (calib.step == 0) {
    Serial.println("\n=== 반응속도 게임 ===");
    waitForEnter("1단계: 센서 앞을 비워주세요");
    calib.step = 1;
  }

  if (calib.step == 1) {
    float emptyDist;

    if (measureAverage(10, emptyDist)) {
      Serial.print("빈 공간: ");
      Serial.print(emptyDist, 1);
      Serial.println(" cm");
    }

    calib.step = 0;
    game.state = CALIB_PLAYER;
  }
}

// =====================================================================
// 캘리브 Player
// =====================================================================
void doCalibratePlayer() {
  if (calib.step == 0) {
    waitForEnter("2단계: 기본 위치에 서주세요");
    calib.step = 1;
  }

  if (calib.step == 1) {
    if (!measureAverage(10, game.basePos)) {
      Serial.println("측정 실패, 다시 시도");
      calib.step = 0;
      return;
    }

    game.minPos = game.basePos - ZONE_SIZE;
    game.maxPos = game.basePos + ZONE_SIZE;

    Serial.println("캘리브레이션 완료");

    playSuccess();
    calib.step = 0;
    game.state = GAME_READY;
  }
}

// =====================================================================
// 게임 준비
// =====================================================================
void doGameReady() {
  Serial.print("레벨: ");
  Serial.print(game.level);
  Serial.print(" | 제한시간: ");
  Serial.print(game.timeLimit);
  Serial.println("ms");

  delay(500);

  currentRound.startTime = millis();
  currentRound.playerDetectCount = 0;
  currentRound.wasInZone = false;
  currentRound.escaped = false;
  currentRound.reactionTime = 0;

  game.state = GAME_WAIT;
}

// =====================================================================
// 대기 후 발사
// =====================================================================
void doGameWait() {
  static unsigned long waitTime = 0;

  if (waitTime == 0)
    waitTime = random(1000, 3000);

  if (millis() - currentRound.startTime >= waitTime) {
    digitalWrite(LED, HIGH);
    playSound(2000, 150);

    currentRound.fireTime = millis();

    sendJsonFire(currentRound.fireTime);

    waitTime = 0;
    game.state = GAME_PLAY;
  }
}

// =====================================================================
// 게임 플레이
// =====================================================================
void doGamePlay() {
  float dist = measureDistance();

  if (dist > 0) {
    sendJsonDistance(dist);

    bool inZone = (dist >= game.minPos && dist <= game.maxPos);

    if (inZone) {
      currentRound.playerDetectCount++;
      currentRound.wasInZone = true;
    } else {
      if (currentRound.wasInZone && !currentRound.escaped) {
        currentRound.escaped = true;
        currentRound.reactionTime = millis() - currentRound.fireTime;
        sendJsonEscape(currentRound.reactionTime);
      }
      currentRound.wasInZone = false;
    }
  }

  if (millis() - currentRound.fireTime >= game.timeLimit) {
    game.state = GAME_RESULT;
  }

  delay(20);
}

// =====================================================================
// 결과 처리
// =====================================================================
void doGameResult() {
  digitalWrite(LED, LOW);

  bool playerWasPresent = (currentRound.playerDetectCount >= MIN_PLAYER_COUNT);

  if (!playerWasPresent) {
    sendJsonResult("invalid", game.level, game.timeLimit,
                   currentRound.playerDetectCount, 0);
    playFail();
  } else if (currentRound.escaped) {
    sendJsonResult("success", game.level, game.timeLimit,
                   currentRound.playerDetectCount, currentRound.reactionTime);
    playSuccess();

    if (game.timeLimit > MIN_TIME) {
      game.timeLimit -= TIME_STEP;
      game.level++;
    }
  } else {
    sendJsonResult("fail", game.level, game.timeLimit,
                   currentRound.playerDetectCount, 0);
    playFail();
    game.level = 1;
    game.timeLimit = INITIAL_TIME;
  }

  delay(2000);
  game.state = GAME_READY;
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
}

// =====================================================================
// LOOP
// =====================================================================
void loop() {
  switch (game.state) {
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
