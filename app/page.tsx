"use client";

import { useEffect, useMemo, useState } from "react";

type PersonId = "wife" | "husband";
type WorkoutType = "zone2" | "squat" | "pushup";

type Workout = {
  id: string;
  person: PersonId;
  type: WorkoutType;
  amount: number;
  date: string;
};

const PEOPLE = {
  wife: { name: "아내", initial: "아", color: "violet" },
  husband: { name: "나", initial: "나", color: "lime" },
} as const;

const EXERCISES = {
  zone2: { label: "존2 러닝", icon: "◒", unit: "분", goal: 30, points: 1.6 },
  squat: { label: "스쿼트", icon: "↯", unit: "회", goal: 50, points: 1 },
  pushup: { label: "푸쉬업", icon: "↑", unit: "회", goal: 40, points: 1.25 },
} as const;

const AVAILABLE: Record<PersonId, WorkoutType[]> = {
  wife: ["zone2", "squat"],
  husband: ["pushup", "squat"],
};

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const dayKey = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dateKey(date);
};

const STARTER_WORKOUTS: Workout[] = [];

function score(workout: Workout) {
  const exercise = EXERCISES[workout.type];
  return Math.min(100, Math.round((workout.amount / exercise.goal) * 100));
}

function calculateStreak(workouts: Workout[]) {
  const completedDays = new Set(workouts.filter((item) => score(item) >= 80).map((item) => item.date));
  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    if (!completedDays.has(dayKey(-i))) break;
    streak += 1;
  }
  return streak;
}

export default function Home() {
  const [person, setPerson] = useState<PersonId>("wife");
  const [workouts, setWorkouts] = useState<Workout[]>(STARTER_WORKOUTS);
  const [hydrated, setHydrated] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<WorkoutType>("zone2");
  const [amount, setAmount] = useState(30);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("done-together-workouts");
    if (saved) {
      try {
        setWorkouts(JSON.parse(saved));
      } catch {
        window.localStorage.removeItem("done-together-workouts");
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem("done-together-workouts", JSON.stringify(workouts));
    }
  }, [hydrated, workouts]);

  useEffect(() => {
    const first = AVAILABLE[person][0];
    setSelectedType(first);
    setAmount(EXERCISES[first].goal);
  }, [person]);

  const personWorkouts = useMemo(
    () => workouts.filter((item) => item.person === person),
    [person, workouts],
  );

  const todayWorkouts = personWorkouts.filter((item) => item.date === dayKey(0));
  const todayScore = Math.min(100, todayWorkouts.reduce((total, item) => total + score(item), 0));
  const weeklyCount = personWorkouts.filter((item) => item.date >= dayKey(-6)).length;
  const streak = calculateStreak(personWorkouts);
  const totalPoints = Math.round(
    personWorkouts.reduce((total, item) => total + item.amount * EXERCISES[item.type].points, 0),
  );
  const level = Math.max(1, Math.floor(totalPoints / 250) + 1);
  const levelProgress = totalPoints % 250;
  const todayLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date());

  const weeklyDays = Array.from({ length: 7 }, (_, index) => {
    const offset = index - 6;
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const items = personWorkouts.filter((item) => item.date === dayKey(offset));
    return {
      key: dayKey(offset),
      label: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
      day: date.getDate(),
      done: items.length > 0,
      today: offset === 0,
    };
  });

  const openSheet = (type?: WorkoutType) => {
    const nextType = type ?? AVAILABLE[person][0];
    setSelectedType(nextType);
    setAmount(EXERCISES[nextType].goal);
    setSheetOpen(true);
  };

  const addWorkout = () => {
    if (amount <= 0) return;
    const entry: Workout = {
      id: `${Date.now()}`,
      person,
      type: selectedType,
      amount,
      date: dayKey(0),
    };
    setWorkouts((current) => [entry, ...current]);
    setSheetOpen(false);
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 2200);
  };

  const removeWorkout = (id: string) => {
    setWorkouts((current) => current.filter((item) => item.id !== id));
  };

  return (
    <main className="app-shell">
      {celebrate && (
        <div className="celebration" role="status">
          <span>✦</span>
          <strong>오늘도 해냈어요!</strong>
          <small>한 걸음 더 단단해졌습니다</small>
        </div>
      )}

      <header className="topbar">
        <a className="brand" href="#top" aria-label="오늘도 완료 홈">
          <span className="brand-mark">✓</span>
          <span>오늘도, 완료</span>
        </a>
        <button className="icon-button" aria-label="알림">
          <span>♢</span>
          <i />
        </button>
      </header>

      <section className="hero" id="top">
        <div className="intro-row">
          <div>
            <p className="eyebrow">{todayLabel}</p>
            <h1>
              우리, 오늘도
              <br />
              <em>가볍게 시작해요.</em>
            </h1>
          </div>
          <div className="couple-badge" aria-label="함께 운동 중">
            <span className="avatar wife">아</span>
            <span className="avatar husband">나</span>
            <span className="heart">♥</span>
          </div>
        </div>

        <div className="person-switch" role="tablist" aria-label="기록할 사람 선택">
          {(Object.keys(PEOPLE) as PersonId[]).map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={person === id}
              className={person === id ? `active ${PEOPLE[id].color}` : ""}
              onClick={() => setPerson(id)}
            >
              <span className={`mini-avatar ${PEOPLE[id].color}`}>{PEOPLE[id].initial}</span>
              {PEOPLE[id].name}
              {person === id && <b>기록 중</b>}
            </button>
          ))}
        </div>
      </section>

      <section className="today-card">
        <div className="today-copy">
          <p className="section-label">오늘의 움직임</p>
          <h2>{todayScore >= 100 ? "목표를 채웠어요!" : "조금만 움직여볼까요?"}</h2>
          <p>
            {todayWorkouts.length > 0
              ? `${PEOPLE[person].name}의 기록 ${todayWorkouts.length}개가 쌓였어요.`
              : "작은 기록 하나가 좋은 리듬을 만들어요."}
          </p>
          <button className="primary-button" onClick={() => openSheet()}>
            <span>＋</span> 운동 기록하기
          </button>
        </div>
        <div className={`progress-ring ${PEOPLE[person].color}`} style={{ "--progress": todayScore } as React.CSSProperties}>
          <div>
            <strong>{todayScore}</strong>
            <span>%</span>
            <small>오늘 달성</small>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="운동 통계">
        <article>
          <span className="stat-icon fire">♨</span>
          <div>
            <small>연속 달성</small>
            <strong>{streak}<em>일</em></strong>
          </div>
          <span className="trend">최고예요</span>
        </article>
        <article>
          <span className="stat-icon bolt">ϟ</span>
          <div>
            <small>이번 주</small>
            <strong>{weeklyCount}<em>회</em></strong>
          </div>
          <span className="trend purple">꾸준해요</span>
        </article>
      </section>

      <section className="section workout-section">
        <div className="section-heading">
          <div>
            <p className="section-label">빠른 기록</p>
            <h2>{PEOPLE[person].name}의 운동</h2>
          </div>
          <button onClick={() => openSheet()}>직접 기록 <span>→</span></button>
        </div>
        <div className="exercise-list">
          {AVAILABLE[person].map((type, index) => {
            const item = EXERCISES[type];
            const latest = todayWorkouts.find((workout) => workout.type === type);
            return (
              <button className={`exercise-card exercise-${index}`} key={type} onClick={() => openSheet(type)}>
                <span className="exercise-icon">{item.icon}</span>
                <span className="exercise-copy">
                  <strong>{item.label}</strong>
                  <small>{latest ? `오늘 ${latest.amount}${item.unit} 완료` : `목표 ${item.goal}${item.unit}`}</small>
                </span>
                <span className={latest ? "exercise-state done" : "exercise-state"}>
                  {latest ? "✓" : "+"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section week-section">
        <div className="section-heading">
          <div>
            <p className="section-label">이번 주 리듬</p>
            <h2>하루하루 쌓이는 중</h2>
          </div>
          <span className="week-score">{weeklyCount}/7</span>
        </div>
        <div className="week-track">
          {weeklyDays.map((day) => (
            <div className={`${day.done ? "done" : ""} ${day.today ? "today" : ""}`} key={day.key}>
              <span>{day.label}</span>
              <b>{day.done ? "✓" : day.day}</b>
              {day.today && <small>오늘</small>}
            </div>
          ))}
        </div>
      </section>

      <section className="level-card">
        <div className="level-medal"><span>★</span></div>
        <div className="level-copy">
          <p>함께 성장하는 중</p>
          <h2>꾸준함 레벨 {level}</h2>
          <div className="level-bar"><i style={{ width: `${(levelProgress / 250) * 100}%` }} /></div>
          <small>다음 레벨까지 {250 - levelProgress} 포인트</small>
        </div>
        <span className="spark spark-one">✦</span>
        <span className="spark spark-two">✦</span>
      </section>

      {todayWorkouts.length > 0 && (
        <section className="section history-section">
          <div className="section-heading">
            <div>
              <p className="section-label">오늘의 기록</p>
              <h2>잘 해낸 순간들</h2>
            </div>
          </div>
          <div className="history-list">
            {todayWorkouts.map((item) => (
              <div key={item.id}>
                <span>{EXERCISES[item.type].icon}</span>
                <p><strong>{EXERCISES[item.type].label}</strong><small>{item.amount}{EXERCISES[item.type].unit} · 오늘</small></p>
                <button aria-label={`${EXERCISES[item.type].label} 기록 삭제`} onClick={() => removeWorkout(item.id)}>×</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer>
        <span>♥</span>
        <p>서로의 오늘을 응원해요.</p>
      </footer>

      {sheetOpen && (
        <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSheetOpen(false)}>
          <section className="record-sheet" role="dialog" aria-modal="true" aria-labelledby="record-title">
            <button className="sheet-close" onClick={() => setSheetOpen(false)} aria-label="닫기">×</button>
            <span className={`sheet-avatar ${PEOPLE[person].color}`}>{PEOPLE[person].initial}</span>
            <p className="section-label">{PEOPLE[person].name}의 오늘</p>
            <h2 id="record-title">어떤 운동을 했나요?</h2>
            <div className="type-selector">
              {AVAILABLE[person].map((type) => (
                <button
                  key={type}
                  className={selectedType === type ? "selected" : ""}
                  onClick={() => {
                    setSelectedType(type);
                    setAmount(EXERCISES[type].goal);
                  }}
                >
                  <span>{EXERCISES[type].icon}</span>
                  {EXERCISES[type].label}
                </button>
              ))}
            </div>
            <div className="amount-control">
              <button onClick={() => setAmount((value) => Math.max(1, value - (selectedType === "zone2" ? 5 : 10)))} aria-label="운동량 줄이기">−</button>
              <label>
                <input type="number" min="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
                <span>{EXERCISES[selectedType].unit}</span>
              </label>
              <button onClick={() => setAmount((value) => value + (selectedType === "zone2" ? 5 : 10))} aria-label="운동량 늘리기">＋</button>
            </div>
            <p className="goal-hint">오늘 목표 {EXERCISES[selectedType].goal}{EXERCISES[selectedType].unit}</p>
            <button className="save-button" onClick={addWorkout}>완료로 기록하기 <span>✓</span></button>
          </section>
        </div>
      )}
    </main>
  );
}
