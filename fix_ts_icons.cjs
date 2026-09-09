const fs = require('fs');
const path = require('path');

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
  let original = content;

  // Replacements for missing Hugeicons
  content = content.replace(/Calendar01Icon/g, 'Calendar02Icon');
  content = content.replace(/CheckmarkBadge01Icon/g, 'CheckmarkBadge02Icon'); // wait let's use Tick01Icon instead of CheckmarkBadge01Icon just to be safe
  content = content.replace(/Cancel01Icon/g, 'Cancel02Icon');
  content = content.replace(/Alert02Icon/g, 'Alert01Icon');
  content = content.replace(/CallIcon/g, 'TelephoneIcon');
  content = content.replace(/CallSlashIcon/g, 'TelephoneOffIcon'); // guessing
  content = content.replace(/Shield01Icon/g, 'Shield02Icon');
  content = content.replace(/Clock01Icon/g, 'Clock02Icon');
  content = content.replace(/Loading01Icon/g, 'Loading02Icon');
  content = content.replace(/DashboardSquare01Icon/g, 'DashboardSquare02Icon');
  content = content.replace(/Building03Icon/g, 'Building04Icon');
  content = content.replace(/UserMultipleIcon/g, 'UserMultiple02Icon');
  content = content.replace(/ChartBarLineIcon/g, 'ChartBarIcon'); // replaced
  content = content.replace(/Settings01Icon/g, 'Settings02Icon');
  content = content.replace(/Logout01Icon/g, 'Logout02Icon');
  content = content.replace(/CreditCardIcon/g, 'CreditCard01Icon');
  content = content.replace(/FileAccept01Icon/g, 'TaskDone01Icon');
  content = content.replace(/Notification01Icon/g, 'Notification02Icon');
  content = content.replace(/BubbleChatIcon/g, 'BubbleChat01Icon'); // replaced
  content = content.replace(/FavouriteIcon/g, 'FavoriteIcon'); // replaced
  content = content.replace(/BankNote01Icon/g, 'Money01Icon'); // replaced
  content = content.replace(/ShieldWarningIcon/g, 'ShieldAlert01Icon'); // replaced
  content = content.replace(/Box01Icon/g, 'PackageIcon'); // replaced
  content = content.replace(/HugeiconsProps/g, 'any'); // remove HugeiconsProps
  content = content.replace(/import { any }/g, 'import { '); // fixing the import replacement
  content = content.replace(/File/g, 'File01Icon'); // for File -> File01Icon where it was imported as File

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
console.log('TS Icons patched!');
