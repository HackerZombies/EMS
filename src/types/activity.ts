interface BaseActivity {
    id: string;
    timestamp: string;
  }
  
  interface StandardActivity extends BaseActivity {
    type: 'login' | 'logout' | 'update' | 'create' | 'delete' | string;
    description: string;
  }
  
  interface EventActivity extends BaseActivity {
    type: 'Announcements' | 'Help' | 'Leave' | 'Documents' | 'Attendance';
    icon: string;
    date: Date;
    title: string;
    text: string;
    linkTo?: string;
  }
  
  export type Activity = StandardActivity | EventActivity;