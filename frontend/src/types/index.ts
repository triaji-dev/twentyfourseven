export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  categoryId: string;
  category?: Category;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId?: string;
  categoryId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  category?: Category;
  project?: Project;
}

export interface Takeaway {
  id: string;
  userId: string;
  content: string;
  date: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetHours: number;
  deadline?: string;
  completed: boolean;
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  color: string;
  totalDuration: number;
  count: number;
  percentage: number;
}

export interface DashboardData {
  today: {
    totalDuration: number;
    totalHours: number;
    categoryData: CategoryStat[];
    entryCount: number;
    goals: Goal[];
  };
  week: {
    totalDuration: number;
    totalHours: number;
    categoryData: CategoryStat[];
    entryCount: number;
  };
  activeTimer: TimeEntry | null;
}
