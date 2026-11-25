import {
  LayoutDashboard, CalendarCheck, ClipboardList, BookOpen, Megaphone, CalendarDays,
  UserCircle, Users, GraduationCap, Layers,
} from 'lucide-react';

export const NAV = {
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/student/materials', label: 'Study Materials', icon: BookOpen },
    { to: '/student/notices', label: 'Notice Board', icon: Megaphone },
    { to: '/student/events', label: 'Events', icon: CalendarDays },
    { to: '/student/profile', label: 'My Profile', icon: UserCircle },
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/teacher/students', label: 'Students', icon: Users },
    { to: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/teacher/materials', label: 'Study Materials', icon: BookOpen },
    { to: '/teacher/notices', label: 'Notices', icon: Megaphone },
    { to: '/teacher/profile', label: 'My Profile', icon: UserCircle },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/teachers', label: 'Teachers', icon: GraduationCap },
    { to: '/admin/subjects', label: 'Subjects', icon: Layers },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/admin/materials', label: 'Study Materials', icon: BookOpen },
    { to: '/admin/notices', label: 'Notices', icon: Megaphone },
    { to: '/admin/events', label: 'Events', icon: CalendarDays },
    { to: '/admin/profile', label: 'My Profile', icon: UserCircle },
  ],
};
