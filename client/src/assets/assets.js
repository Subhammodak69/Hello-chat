// assets.js

const avatarIcons = [
  'https://randomuser.me/api/portraits/men/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  // Add more avatar URLs
];
const avatar_icon = 'assets/avatar.avif';
const arrow_icon = 'assets/left-arrow.png';
const help = 'assets/quistion.png';

const userDummyData = [
  {
    id: 1,
    name: 'John Doe',
    avatar: avatarIcons[0],
    lastMessage: 'Hey there!',
    lastActive: '10 mins ago',
    is_online:false,
    bio:"heloooo my name is .....sgdsujfhbsdn svdhfvnds svfhbdshfhdsvhgfvhdsgvgfvdsghfvsgvhvfhsvfs",  
  },
  {
    id: 2,
    name: 'Jane Smith',
    avatar: '',
    lastMessage: 'What’s up?',
    lastActive: '5 mins ago',
    is_online:true,
    bio:"heloooo my name is .....sgdsujfhbsdn svdhfvnds svfhbdshfhdsvhgfvhdsgvgfvdsghfvsgvhvfhsvfs",    
  },
  {
    id: 3,
    name: 'Bob Johnson',
    avatar: avatarIcons[2],
    lastMessage: 'Let’s meet tomorrow.',
    lastActive: '1 hour ago',
    is_online:true,
    bio:"heloooo my name is .....sgdsujfhbsdn svdhfvnds svfhbdshfhdsvhgfvhdsgvgfvdsghfvsgvhvfhsvfs",  
  },
  {
    id: 4,
    name: 'Alice Williams',
    avatar: avatarIcons[3],
    lastMessage: 'Got it, thanks!',
    lastActive: '2 hours ago',
    is_online:false,
    bio:"heloooo my name is .....sgdsujfhbsdn svdhfvnds svfhbdshfhdsvhgfvhdsgvgfvdsghfvsgvhvfhsvfs",  
  },
  // Add more dummy users as needed
];

// Sample messages structure for a chat app
const chatMessagesDummyData = {
  1: [
    { senderId: 1, message: 'Hello!i amedsfm mncv mcn xnv cxn vn cnx vn xcn v', timestamp: '2025-09-01T11:15:00',sender_pic: avatarIcons[0] },
    { senderId: 0, message: 'Hi John!', timestamp: '2025-09-01T11:15:00',sender_pic: avatarIcons[1] },
    { senderId: 1, message: 'Hellodzfhbxcn!i amedsfm mncv mcn xnv cxn vn cnx vn xcn v', timestamp: '2025-09-01T11:15:00',sender_pic: avatarIcons[0] },
    { senderId: 0, message: 'Hi Johnxnvmncxnv ncx vb xcb vxc vn cnv cxn vnc nv!', timestamp: '2025-09-01T11:15:00',sender_pic: avatarIcons[1] },
    { senderId: 1, message: 'Hello!i amedsfm mncv mcn xnv cxn vn cnx vn xcn v', timestamp: '2025-09-01T11:15:00',sender_pic: avatarIcons[0] },
    { senderId: 0, message: 'Hi Jocxnv nxcnvncxbnvbcnbvncxvncbxnbvncxhn!', timestamp: '2025-09-01T11:15:00',sender_pic: avatarIcons[1] },
    { senderId: 1, message: 'Hello!i amedsfm mncv mcn xnv cxn vn cnx vn xcn v', timestamp: '2025-09-01T11:15:00',sender_pic: avatarIcons[0] },
    { senderId: 0, message: 'Hi xcvncxbvbncxbnvbnJohn!', timestamp: '2025-09-01T11:15:00',sender_pic: avatarIcons[1] },
  ],
  2: [
    { senderId: 2, message: 'Are you coming?', timestamp: '2025-09-01T11:15:00Z',sender_pic: avatarIcons[2] },
    { senderId: 0, message: 'Yes, on my way.', timestamp: '2025-09-01T11:16:00Z',sender_pic: avatarIcons[0] },
  ],
  // Add more chat histories keyed by userId
};

const assets = {
  avatarIcons,
  userDummyData,
  chatMessagesDummyData,
};

export default assets;
