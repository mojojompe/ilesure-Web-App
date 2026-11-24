import React from 'react';
import { clsx } from 'clsx';
import {
  Home01Icon,
  Calendar01Icon,
  Chatting01Icon,
  Notification01Icon,
  CreditCardIcon,
  UserMultipleIcon,
  InformationCircleIcon,
  Search01Icon,
  FavouriteIcon,
  ArchiveIcon,
  Building03Icon,
  StarIcon,
  WifiDisconnected01Icon,
  Alert01Icon,
} from '@hugeicons/react';

export type EmptyIllustrationName =
  | 'listings'
  | 'bookings'
  | 'chats'
  | 'notifications'
  | 'payments'
  | 'team'
  | 'inquiries'
  | 'search'
  | 'saved'
  | 'archive'
  | 'store'
  | 'roommates'
  | 'reviews'
  | 'offline'
  | 'unavailable';

interface EmptyIllustrationProps {
  name: EmptyIllustrationName;
  className?: string;
  size?: number;
}

export function EmptyIllustration({ name, className, size = 48 }: EmptyIllustrationProps) {
  const getIcon = () => {
    switch (name) {
      case 'listings':
        return <Home01Icon size={size} className="text-primary" />;
      case 'bookings':
        return <Calendar01Icon size={size} className="text-primary" />;
      case 'chats':
        return <Chatting01Icon size={size} className="text-primary" />;
      case 'notifications':
        return <Notification01Icon size={size} className="text-primary" />;
      case 'payments':
        return <CreditCardIcon size={size} className="text-primary" />;
      case 'team':
      case 'roommates':
        return <UserMultipleIcon size={size} className="text-primary" />;
      case 'inquiries':
        return <InformationCircleIcon size={size} className="text-primary" />;
      case 'search':
        return <Search01Icon size={size} className="text-primary" />;
      case 'saved':
        return <FavouriteIcon size={size} className="text-primary" />;
      case 'archive':
        return <ArchiveIcon size={size} className="text-primary" />;
      case 'store':
        return <Building03Icon size={size} className="text-primary" />;
      case 'reviews':
        return <StarIcon size={size} className="text-primary" />;
      case 'offline':
        return <WifiDisconnected01Icon size={size} className="text-primary" />;
      case 'unavailable':
      default:
        return <Alert01Icon size={size} className="text-primary" />;
    }
  };

  return (
    <div
      className={clsx(
        'relative flex items-center justify-center rounded-3xl bg-[#FAF1CC]/60 border border-[#E1AD01]/20 shadow-clay-sm p-6 mx-auto',
        className
      )}
    >
      <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#E1AD01]" />
      {getIcon()}
    </div>
  );
}
