export type Event = {
    type: string;
    icon: string;
    date: Date;
    title: string;
    text: string;
    linkTo?: string;
  };
  
  export type Announcement = {
    id: string;
    title: string;
    text: string;
    dateCreated: Date;
    role: string;
  };
  
  