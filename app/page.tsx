"use client";

import { useEffect, useMemo, useState } from "react";

type PersonId = "wife" | "husband";
type ExerciseUnit = "회" | "분" | "초";

type ExerciseDef = {
  id: string;
  label: string;
  icon: string;
  unit: ExerciseUnit;
  goal: number;
  points: number;
  people: PersonId[];
  custom?: boolean;
};

type Workout = {
  id: string;
  person: PersonId;
  exerciseId: string;
  amount: number;
  date: string;
};

const PEOPLE = {
  wife: { name: "아내", initial: "아", color: "violet" },
  husband: { name: "나", initial: "나", color: "lime" },
} as const;

const DEFAULT_EXERCISES: ExerciseDef[] = [
  { id: "zone2", label: "존2 러닝", icon: "◒", unit: "분", goal: 30, points: 1.6, people: ["wife"] },
  { id: "squat", label: "스쿼트", icon: "↯", unit: "회", goal: 50, points: 1, people: ["wife", "husband"] },
  { id: "pushup", label: "푸쉬업", icon: "↑", unit: "회", goal: 40, points: 1.25, people: ["husband"] },
];

const PRESET_EXERCISES: Array<Omit<ExerciseDef, "people">> = [
  { id: "situp", label: "윗몸일으키기", icon: "⌁", unit: "회", goal: 30, points: 1 },
  { id: "plank", label: "플랭크", icon: "▰", unit: "초", goal: 60, points: 0.7 },
  { id: "lunge", label: "런지", icon: "◇", unit: "회", goal: 30, points: 1.1 },
  { id: "burpee", label: "버피", icon: "✦", unit: "회", goal: 15, points: 2 },
  { id: "mountain", label: "마운틴 클라이머", icon: "△", unit: "회", goal: 40, points: 1 },
  { id: "bridge", label: "힙 브릿지", icon: "∩", unit: "회", goal: 30, points: 1 },
  { id: "jumpingjack", label: "점핑잭", icon: "※", unit: "회", goal: 50, points: 0.8 },
  { id: "calfraise", label: "카프레이즈", icon: "↥", unit: "회", goal: 40, points: 0.8 },
];

const ICON_OPTIONS = ["✦", "↯", "↑", "⌁", "▰", "◇", "△", "∩", "※", "●", "◒", "↥"];
const WORKOUT_STORAGE = "done-together-workouts";
const EXERCISE_STORAGE = "done-together-exercises";

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const dayKey = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dateKey(date);
};

const formatRecordDate = (value: string) => {
  if (value === dayKey(0)) return "오늘";
  const [, month, day] = value.split("-").map(Number);
  return `${month}월 ${day}일`;
};

const exerciseFor = (exercises: ExerciseDef[], id: string) =>
  exercises.find((exercise) => exercise.id === id) ?? {
    id,
    label: "운동",
    icon: "●",
    unit: "회" as ExerciseUnit,
    goal: 1,
    points: 1,
    people: ["wife", "husband"] as PersonId[],
  };

function workoutScore(workout: Workout, exercises: ExerciseDef[]) {
  const exercise = exerciseFor(exercises, workout.exerciseId);
  return Math.min(100, Math.round((workout.amount / exercise.goal) * 100));
}

function calculateStreak(workouts: Workout[], exercises: ExerciseDef[]) {
  const completedDays = new Set(
    workouts.filter((item) => workoutScore(item, exercises) >= 80).map((item) => item.date),
  );
  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    if (!completedDays.has(dayKey(-i))) break;
    streak += 1;
  }
  return streak;
}

export default function Home() {
  const [person, setPerson] = useState<PersonId>("wife");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<ExerciseDef[]>(DEFAULT_EXERCISES);
  const [hydrated, setHydrated] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [exerciseSheetOpen, setExerciseSheetOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState("zone2");
  const [amount, setAmount] = useState(30);
  const [recordDate, setRecordDate] = useState(dayKey(0));
  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState<ExerciseUnit>("회");
  const [customGoal, setCustomGoal] = useState(30);
  const [customIcon, setCustomIcon] = useState("✦");
  const [toast, setToast] = useState<{ title: string; detail: string } | null>(null);

  const availableExercises = useMemo(
    () => exercises.filter((exercise) => exercise.people.includes(person)),
    [exercises, person],
  );

  const selectedExercise =
    availableExercises.find((exercise) => exercise.id === selectedExerciseId) ?? availableExercises[0];

  useEffect(() => {
    const savedExercises = window.localStorage.getItem(EXERCISE_STORAGE);
    if (savedExercises) {
      try {
        const parsed = JSON.parse(savedExercises) as ExerciseDef[];
        const defaultIds = new Set(DEFAULT_EXERCISES.map((item) => item.id));
        setExercises([
          ...DEFAULT_EXERCISES.map((item) => parsed.find((saved) => saved.id === item.id) ?? item),
          ...parsed.filter((item) => !defaultIds.has(item.id)),
        ]);
      } catch {
        window.localStorage.removeItem(EXERCISE_STORAGE);
      }
    }

    const savedWorkouts = window.localStorage.getItem(WORKOUT_STORAGE);
    if (savedWorkouts) {
      try {
        const parsed = JSON.parse(savedWorkouts) as Array<Workout & { type?: string }>;
        setWorkouts(
          parsed
            .map((item) => ({
              id: item.id,
              person: item.person,
              exerciseId: item.exerciseId ?? item.type ?? "",
              amount: item.amount,
              date: item.date,
            }))
            .filter((item) => item.exerciseId),
        );
      } catch {
        window.localStorage.removeItem(WORKOUT_STORAGE);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(WORKOUT_STORAGE, JSON.stringify(workouts));
    window.localStorage.setItem(EXERCISE_STORAGE, JSON.stringify(exercises));
  }, [hydrated, workouts, exercises]);

  useEffect(() => {
    const first = availableExercises[0];
    if (!first) return;
    if (!availableExercises.some((exercise) => exercise.id === selectedExerciseId)) {
      setSelectedExerciseId(first.id);
      setAmount(first.goal);
    }
  }, [availableExercises, selectedExerciseId]);

  const personWorkouts = useMemo(
    () => workouts.filter((item) => item.person === person),
    [person, workouts],
  );
  const todayWorkouts = personWorkouts.filter((item) => item.date === dayKey(0));
  const recentWorkouts = [...personWorkouts]
    .sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id))
    .slice(0, 8);
  const todayScore = Math.min(
    100,
    todayWorkouts.reduce((total, item) => total + workoutScore(item, exercises), 0),
  );
  const weeklyCount = personWorkouts.filter((item) => item.date >= dayKey(-6) && item.date <= dayKey(0)).length;
  const streak = calculateStreak(personWorkouts, exercises);
  const totalPoints = Math.round(
    personWorkouts.reduce(
      (total, item) => total + item.amount * exerciseFor(exercises, item.exerciseId).points,
      0,
    ),
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

  const showToast = (title: string, detail: string) => {
    setToast({ title, detail });
    window.setTimeout(() => setToast(null), 2200);
  };

  const openSheet = (exerciseId?: string) => {
    const next = availableExercises.find((item) => item.id === exerciseId) ?? availableExercises[0];
    if (!next) return;
    setSelectedExerciseId(next.id);
    setAmount(next.goal);
    setRecordDate(dayKey(0));
    setSheetOpen(true);
  };

  const addWorkout = () => {
    if (!selectedExercise || amount <= 0 || !recordDate) return;
    const entry: Workout = {
      id: `${Date.now()}`,
      person,
      exerciseId: selectedExercise.id,
      amount,
      date: recordDate,
    };
    setWorkouts((current) => [entry, ...current]);
    setSheetOpen(false);
    showToast(
      recordDate === dayKey(0) ? "오늘도 해냈어요!" : `${formatRecordDate(recordDate)} 기록 완료!`,
      `${selectedExercise.label} ${amount}${selectedExercise.unit}을 기록했어요`,
    );
  };

  const addPreset = (preset: Omit<ExerciseDef, "people">) => {
    setExercises((current) => {
      const existing = current.find((item) => item.id === preset.id);
      if (existing) {
        return current.map((item) =>
          item.id === preset.id && !item.people.includes(person)
            ? { ...item, people: [...item.people, person] }
            : item,
        );
      }
      return [...current, { ...preset, people: [person] }];
    });
    setSelectedExerciseId(preset.id);
    setAmount(preset.goal);
    setExerciseSheetOpen(false);
    showToast("운동 종목을 추가했어요!", `${PEOPLE[person].name}의 운동에 ${preset.label} 추가`);
  };

  const addCustomExercise = () => {
    const label = customName.trim();
    if (!label || customGoal <= 0) return;
    const exercise: ExerciseDef = {
      id: `custom-${Date.now()}`,
      label,
      icon: customIcon,
      unit: customUnit,
      goal: customGoal,
      points: customUnit === "분" ? 1.5 : customUnit === "초" ? 0.7 : 1,
      people: [person],
      custom: true,
    };
    setExercises((current) => [...current, exercise]);
    setSelectedExerciseId(exercise.id);
    setAmount(exercise.goal);
    setCustomName("");
    setExerciseSheetOpen(false);
    showToast("나만의 운동을 만들었어요!", `${exercise.icon} ${exercise.label} · 목표 ${exercise.goal}${exercise.unit}`);
  };

  const removeWorkout = (id: string) => {
    setWorkouts((current) => current.filter((item) => item.id !== id));
  };

  const unusedPresets = PRESET_EXERCISES.filter(
    (preset) => !availableExercises.some((exercise) => exercise.id === preset.id),
  );
  const amountStep = selectedExercise?.unit === "분" ? 5 : 10;

  return (
    <main className="app-shell">
      {toast && (
        <div className="celebration" role="status">
          <span>✦</span>
          <strong>{toast.title}</strong>
          <small>{toast.detail}</small>
        </div>
      )}

      <header className="topbar">
        <a className="brand" href="#top" aria-label="오늘도 완료 홈">
          <span className="brand-mark">✓</span>
          <span>오늘도, 완료</span>
        </a>
        <button className="icon-button" aria-label="알림"><span>♢</span><i /></button>
      </header>

      <section className="hero" id="top">
        <div className="intro-row">
          <div>
            <p className="eyebrow">{todayLabel}</p>
            <h1>우리, 오늘도<br /><em>가볍게 시작해요.</em></h1>
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
          <div><strong>{todayScore}</strong><span>%</span><small>오늘 달성</small></div>
        </div>
      </section>

      <section className="stats-grid" aria-label="운동 통계">
        <article>
          <span className="stat-icon fire">♨</span>
          <div><small>연속 달성</small><strong>{streak}<em>일</em></strong></div>
          <span className="trend">최고예요</span>
        </article>
        <article>
          <span className="stat-icon bolt">ϟ</span>
          <div><small>이번 주</small><strong>{weeklyCount}<em>회</em></strong></div>
          <span className="trend purple">꾸준해요</span>
        </article>
      </section>

      <section className="section workout-section">
        <div className="section-heading">
          <div><p className="section-label">빠른 기록</p><h2>{PEOPLE[person].name}의 운동</h2></div>
          <button onClick={() => openSheet()}>날짜별 기록 <span>→</span></button>
        </div>
        <div className="exercise-list">
          {availableExercises.map((exercise, index) => {
            const latest = todayWorkouts.find((workout) => workout.exerciseId === exercise.id);
            return (
              <button className={`exercise-card exercise-${index % 2}`} key={exercise.id} onClick={() => openSheet(exercise.id)}>
                <span className="exercise-icon">{exercise.icon}</span>
                <span className="exercise-copy">
                  <strong>{exercise.label}</strong>
                  <small>{latest ? `오늘 ${latest.amount}${exercise.unit} 완료` : `목표 ${exercise.goal}${exercise.unit}`}</small>
                </span>
                <span className={latest ? "exercise-state done" : "exercise-state"}>{latest ? "✓" : "+"}</span>
              </button>
            );
          })}
          <button className="exercise-card add-exercise-card" onClick={() => setExerciseSheetOpen(true)}>
            <span className="exercise-icon">＋</span>
            <span className="exercise-copy"><strong>운동 종목 추가</strong><small>홈트 선택 또는 직접 만들기</small></span>
            <span className="exercise-state">→</span>
          </button>
        </div>
      </section>

      <section className="section week-section">
        <div className="section-heading">
          <div><p className="section-label">이번 주 리듬</p><h2>하루하루 쌓이는 중</h2></div>
          <span className="week-score">{weeklyCount}/7</span>
        </div>
        <div className="week-track">
          {weeklyDays.map((day) => (
            <div className={`${day.done ? "done" : ""} ${day.today ? "today" : ""}`} key={day.key}>
              <span>{day.label}</span><b>{day.done ? "✓" : day.day}</b>{day.today && <small>오늘</small>}
            </div>
          ))}
        </div>
      </section>

      <section className="level-card">
        <div className="level-medal"><span>★</span></div>
        <div className="level-copy">
          <p>함께 성장하는 중</p><h2>꾸준함 레벨 {level}</h2>
          <div className="level-bar"><i style={{ width: `${(levelProgress / 250) * 100}%` }} /></div>
          <small>다음 레벨까지 {250 - levelProgress} 포인트</small>
        </div>
        <span className="spark spark-one">✦</span><span className="spark spark-two">✦</span>
      </section>

      {recentWorkouts.length > 0 && (
        <section className="section history-section">
          <div className="section-heading">
            <div><p className="section-label">최근 기록</p><h2>잘 해낸 순간들</h2></div>
          </div>
          <div className="history-list">
            {recentWorkouts.map((item) => {
              const exercise = exerciseFor(exercises, item.exerciseId);
              return (
                <div key={item.id}>
                  <span>{exercise.icon}</span>
                  <p><strong>{exercise.label}</strong><small>{item.amount}{exercise.unit} · {formatRecordDate(item.date)}</small></p>
                  <button aria-label={`${exercise.label} 기록 삭제`} onClick={() => removeWorkout(item.id)}>×</button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer><span>♥</span><p>서로의 오늘을 응원해요.</p></footer>

      {sheetOpen && selectedExercise && (
        <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSheetOpen(false)}>
          <section className="record-sheet" role="dialog" aria-modal="true" aria-labelledby="record-title">
            <button className="sheet-close" onClick={() => setSheetOpen(false)} aria-label="닫기">×</button>
            <span className={`sheet-avatar ${PEOPLE[person].color}`}>{PEOPLE[person].initial}</span>
            <p className="section-label">{PEOPLE[person].name}의 운동 기록</p>
            <h2 id="record-title">어떤 운동을 했나요?</h2>
            <div className="type-selector">
              {availableExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  className={selectedExerciseId === exercise.id ? "selected" : ""}
                  onClick={() => { setSelectedExerciseId(exercise.id); setAmount(exercise.goal); }}
                >
                  <span>{exercise.icon}</span>{exercise.label}
                </button>
              ))}
            </div>
            <label className="date-field" htmlFor="record-date">
              <span>운동한 날짜</span>
              <input id="record-date" type="date" max={dayKey(0)} value={recordDate} onChange={(event) => setRecordDate(event.target.value)} />
            </label>
            <div className="amount-control">
              <button onClick={() => setAmount((value) => Math.max(1, value - amountStep))} aria-label="운동량 줄이기">−</button>
              <label>
                <input type="number" min="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
                <span>{selectedExercise.unit}</span>
              </label>
              <button onClick={() => setAmount((value) => value + amountStep)} aria-label="운동량 늘리기">＋</button>
            </div>
            <p className="goal-hint">{formatRecordDate(recordDate)} 목표 {selectedExercise.goal}{selectedExercise.unit}</p>
            <button className="save-button" onClick={addWorkout}>완료로 기록하기 <span>✓</span></button>
          </section>
        </div>
      )}

      {exerciseSheetOpen && (
        <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setExerciseSheetOpen(false)}>
          <section className="record-sheet exercise-sheet" role="dialog" aria-modal="true" aria-labelledby="exercise-title">
            <button className="sheet-close" onClick={() => setExerciseSheetOpen(false)} aria-label="닫기">×</button>
            <span className={`sheet-avatar ${PEOPLE[person].color}`}>＋</span>
            <p className="section-label">{PEOPLE[person].name}의 운동</p>
            <h2 id="exercise-title">종목을 추가해요</h2>

            {unusedPresets.length > 0 && (
              <>
                <p className="form-label">많이 하는 홈트</p>
                <div className="preset-grid">
                  {unusedPresets.map((preset) => (
                    <button key={preset.id} onClick={() => addPreset(preset)}>
                      <span>{preset.icon}</span><strong>{preset.label}</strong><small>{preset.goal}{preset.unit}</small>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="form-divider"><span>직접 만들기</span></div>
            <p className="form-label">아이콘 선택</p>
            <div className="icon-grid">
              {ICON_OPTIONS.map((icon) => (
                <button key={icon} className={customIcon === icon ? "selected" : ""} onClick={() => setCustomIcon(icon)} aria-label={`${icon} 아이콘 선택`}>{icon}</button>
              ))}
            </div>
            <div className="custom-fields">
              <label><span>운동 이름</span><input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="예: 모닝 스트레칭" maxLength={20} /></label>
              <div>
                <label><span>단위</span><select value={customUnit} onChange={(event) => setCustomUnit(event.target.value as ExerciseUnit)}><option>회</option><option>분</option><option>초</option></select></label>
                <label><span>목표</span><input type="number" min="1" value={customGoal} onChange={(event) => setCustomGoal(Number(event.target.value))} /></label>
              </div>
            </div>
            <button className="save-button" disabled={!customName.trim() || customGoal <= 0} onClick={addCustomExercise}>내 운동으로 추가 <span>＋</span></button>
          </section>
        </div>
      )}
    </main>
  );
}
