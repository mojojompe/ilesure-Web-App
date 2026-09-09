const fs = require('fs');
const path = require('path');

const iconMap = {
  CalendarClock: 'Calendar01Icon',
  CheckCircle2: 'CheckmarkBadge01Icon',
  XCircle: 'Cancel01Icon',
  AlertTriangle: 'Alert02Icon',
  Phone: 'CallIcon',
  PhoneOff: 'CallSlashIcon',
  Mic: 'Mic01Icon',
  MicOff: 'MicOff01Icon',
  Video: 'Video01Icon',
  VideoOff: 'VideoOffIcon',
  Shield: 'Shield01Icon',
  CheckCircle: 'CheckmarkBadge01Icon',
  Clock: 'Clock01Icon',
  Loader2: 'Loading01Icon',
  AlertCircle: 'Alert01Icon',
  ArrowRight: 'ArrowRight01Icon',
  LayoutDashboard: 'DashboardSquare01Icon',
  Building2: 'Building03Icon',
  Users: 'UserMultipleIcon',
  BarChart3: 'ChartBarLineIcon',
  Settings: 'Settings01Icon',
  LogOut: 'Logout01Icon',
  CreditCard: 'CreditCardIcon',
  FileCheck: 'FileAccept01Icon',
  Bell: 'Notification01Icon',
  MessageCircle: 'BubbleChatIcon',
  Heart: 'FavouriteIcon',
  Archive: 'Archive01Icon',
  Plus: 'PlusSignIcon',
  ShoppingCart: 'ShoppingCart01Icon',
  Menu: 'Menu01Icon',
  Search: 'Search01Icon',
  ChevronDown: 'ArrowDown01Icon',
  RefreshCw: 'ReloadIcon',
  FileText: 'Note01Icon',
  Upload: 'Upload01Icon',
  X: 'Cancel01Icon',
  MapPin: 'Location01Icon',
  Loader: 'Loading01Icon',
  Check: 'Tick02Icon',
  FileIcon: 'File01Icon',
  Camera: 'Camera01Icon',
  LucideIcon: 'HugeiconsProps',
  DollarSign: 'BankNote01Icon',
  Store: 'Store01Icon',
  PlusCircle: 'PlusSignCircleIcon',
  Star: 'StarIcon',
  Box: 'Box01Icon',
  Eye: 'ViewIcon',
  TrendingUp: 'ArrowUpRight01Icon',
  RotateCcw: 'ReloadIcon',
  Trash2: 'Delete02Icon',
  Send: 'SentIcon',
  MoreVertical: 'MoreVerticalIcon',
  Home: 'Home01Icon',
  Building: 'Building01Icon',
  Sofa: 'Sofa01Icon',
  Zap: 'FlashIcon',
  Wifi: 'Wifi01Icon',
  ArrowLeft: 'ArrowLeft01Icon',
  Calendar: 'Calendar01Icon',
  ShieldAlert: 'ShieldWarningIcon',
  Mail: 'Mail01Icon',
  ChevronRight: 'ArrowRight01Icon',
  ChevronLeft: 'ArrowLeft01Icon',
  Edit: 'PencilEdit01Icon',
  Image: 'Image01Icon',
  MessageSquare: 'Message01Icon',
  Save: 'FloppyDiskIcon',
  Banknote: 'BankNote01Icon',
  UserPlus: 'UserAdd01Icon',
  Lock: 'LockKeyIcon',
  EyeOff: 'ViewOffIcon',
  Key: 'Key01Icon',
  GraduationCap: 'EducationIcon',
  User: 'UserIcon',
  Briefcase: 'Briefcase01Icon',
  Sparkles: 'SparklesIcon',
  Info: 'InformationCircleIcon',
  ThumbsUp: 'ThumbsUpIcon',
  Bed: 'BedIcon',
  BookOpen: 'BookOpen01Icon',
  Moon: 'Moon01Icon',
  Volume2: 'VolumeHighIcon',
  Globe: 'GlobeIcon',
  File: 'File01Icon',
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;

  // 1. Find all lucide-react imports
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    hasChanges = true;
    const iconsText = match[1];
    
    // Replace Lucide icons with Hugeicons
    let newIconsText = iconsText;
    const oldIcons = iconsText.split(',').map(i => i.trim()).filter(i => i);
    
    oldIcons.forEach(oldIcon => {
      let iconName = oldIcon;
      let alias = null;
      if (oldIcon.includes(' as ')) {
        const parts = oldIcon.split(' as ');
        iconName = parts[0].trim();
        alias = parts[1].trim();
      }
      
      const newIconName = iconMap[iconName] || iconName; // Fallback to same if not found
      
      // Replace the old icon usage in the file
      if (alias) {
        // If it was aliased, replace the alias with the new name throughout the file
        // For simplicity, we just import the new icon and optionally keep the alias
        newIconsText = newIconsText.replace(oldIcon, `${newIconName} as ${alias}`);
      } else {
        newIconsText = newIconsText.replace(new RegExp(`\\b${oldIcon}\\b`, 'g'), newIconName);
        content = content.replace(new RegExp(`\\b<${oldIcon}\\b`, 'g'), `<${newIconName}`);
        content = content.replace(new RegExp(`\\b${oldIcon}\\b`, 'g'), newIconName); // Also replace type refs like LucideIcon
      }
    });

    const newImportStr = `import { ${newIconsText} } from '@hugeicons/react'`;
    content = content.replace(match[0], newImportStr);
  }

  if (hasChanges) {
    fs.writeFileSync(file, content);
  }
});

console.log('Icons replaced successfully!');
