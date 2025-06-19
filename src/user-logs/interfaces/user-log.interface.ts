export interface UserLogResponse {
  Login: {
   registerTime: Date;
   lastLogin: Date;
  },
  Streak: {
   currentStreak: number;
   bestStreak: number;
  },
  Tasks: {
    totalTasks: number;
    totalActualTasks: number;
    completedTasks: number;
    pendingTasks: number;
    droppedTasks: number;
  },
  Habits: {
    activeHabits: number;
    completedHabits: {
      month: number;
      completedDate: number[];
    };
  },
  Events: {
    totalEvents: number;
    totalActualEvents: number;
    spendTimeEvents: number;
  },
  Pomodoros: {
    totalPomodoros: number;
    totalActualPomodoros: number;
    completedPomodoros: number;
    completedPausedPomodoros: number;
    droppedPomodoros: number;
    mediumInterruptions: number;
    PomodoroWithoutInterruptions: number;
    totalInterruptions: number;
    totalTimeDone: number;
    totalTimePlanned: number;

  },
  Calendar: {
    totalEvents: number;
    totalTasks: number;
    percentageTasks: number;
  }
}

export interface PomodoroResponse { //semanal
  pomodoros: {
    day: number;
    pomodoros: number;
  }[];
}

export interface TaskResponse { //muchos meses
  response: {
    month: number;
    year: number;
    completedTasks: number;
    pendingTasks: number;
    droppedTasks: number;
    createdTasks: number;
  }[]
}

export interface HabitResponse { //muchos meses
  response: {
    month: number;
    year: number;
    completedDates: number[];
  }[]
}