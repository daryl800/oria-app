import jetPaths from 'jet-paths';

const Paths = {
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  DailyGuidance: {
    _: '/daily-guidance',
    Today: '/today',
  },
  Profile: {
    _: '/profile',
    Get: '/me',
    SaveBazi: '/bazi',
    ResetBazi: '/bazi/reset',
    SaveMbti: '/mbti',
    Summary: '/summary',
  },
  Chat: {
    _: '/chat',
    Send: '/send',
    History: '/history',
  },
} as const;

export const JetPaths = jetPaths(Paths);
export default Paths;
