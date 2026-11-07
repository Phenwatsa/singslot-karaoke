import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { GlassCard } from './components/layout/GlassCard';
import { LoginModal } from './components/auth/LoginModal';
import { RoomCatalog } from './components/room/RoomCatalog';
import { AvailabilityMatrix } from './components/room/AvailabilityMatrix';
import { BookingModal } from './components/booking/BookingModal';
import { BookingDetailModal } from './components/booking/BookingDetailModal';
import { MyBookingsView } from './components/booking/MyBookingsView';
import { StaffMasterScheduleView } from './components/staff/StaffMasterScheduleView';
import { SplashScreen } from './components/layout/SplashScreen';
import { DatePicker } from './components/common/DatePicker';
import { User } from './types/auth';
import { Room, RoomAvailability, RoomCatalogResponse, AvailabilityResponse } from './types/room';
import {
  saveClientSession,
  clearClientSession,
  validateAndRestoreSession
} from './utils/session';
import { getBangkokTodayString } from './utils/date';
import {
  Mic2,
  ShieldCheck,
  Info,
  CheckCircle2,
  LayoutGrid,
  Clock,
  Sparkles
} from 'lucide-react';

type NavRoute = 'booking' | 'my-bookings' | 'staff-schedule' | 'login';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeNav, setActiveNav] = useState<NavRoute>('booking');
  const [viewMode, setViewMode] = useState<'rooms' | 'timeline'>('rooms');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getBangkokTodayString());

  // Room catalog & availability state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilityRefreshTrigger, setAvailabilityRefreshTrigger] = useState(0);

  // Booking modal state (F-04, Issue #4)
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingRoomId, setBookingRoomId] = useState<string | undefined>(undefined);
  const [bookingSlot, setBookingSlot] = useState<number>(0);

  // Booking detail modal state (F-05, F-06, Issue #6)
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [notice, setNotice] = useState<{
    type: 'info' | 'success';
    message: string;
  } | null>(null);

  // Load saved session on initial render and validate with /api/auth/me
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { token: validatedToken, user: validatedUser } = await validateAndRestoreSession();
        if (validatedToken && validatedUser) {
          setToken(validatedToken);
          setUser(validatedUser);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Failed to restore or validate session from localStorage', err);
      }
    };

    restoreSession();
  }, []);

  // Fetch Room Catalog (F-02, AC-02)
  useEffect(() => {
    const loadRooms = async () => {
      setIsLoadingRooms(true);
      try {
        const res = await fetch('/api/rooms');
        if (res.ok) {
          const data: RoomCatalogResponse = await res.json();
          if (data.success && data.rooms) {
            setRooms(data.rooms);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch rooms', err);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    loadRooms();
  }, []);

  // Fetch Server-Calculated Availability when selectedDate changes (F-03, AC-03)
  // Protected with AbortController, immediate stale data purge, and empty/error state handling
  useEffect(() => {
    // Immediately clear previous availability and reset errors to prevent stale matrix displays
    setAvailability([]);
    setAvailabilityError(null);

    if (!selectedDate) {
      setAvailabilityError('Please select a valid date.');
      setIsLoadingAvailability(false);
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;

    const loadAvailability = async () => {
      setIsLoadingAvailability(true);
      try {
        const res = await fetch(`/api/availability?date=${selectedDate}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data: AvailabilityResponse = await res.json();
          if (isCurrent && data.success && data.rooms) {
            setAvailability(data.rooms);
            setAvailabilityError(null);
          }
        } else {
          if (isCurrent) {
            setAvailability([]);
            setAvailabilityError(`Failed to load availability for ${selectedDate} (HTTP ${res.status}).`);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Normal abort when user changes dates rapidly; ignore stale response
          return;
        }
        if (isCurrent) {
          setAvailability([]);
          setAvailabilityError('Unable to connect to availability service. Please check your connection.');
        }
      } finally {
        if (isCurrent) {
          setIsLoadingAvailability(false);
        }
      }
    };

    loadAvailability();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [selectedDate, availabilityRefreshTrigger]);

  const handleNavigate = (route: NavRoute) => {
    setActiveNav(route);
    switch (route) {
      case 'login':
        setIsLoginOpen(true);
        break;
      case 'booking':
      case 'my-bookings':
      case 'staff-schedule':
        setNotice(null);
        break;
      default:
        setNotice(null);
    }
  };

  const handleLoginSuccess = (authenticatedUser: User, receivedToken: string) => {
    setUser(authenticatedUser);
    setToken(receivedToken);
    saveClientSession(receivedToken, authenticatedUser);
    setNotice({
      type: 'success',
      message: `Signed in successfully as ${authenticatedUser.fullName} (${authenticatedUser.role})!`
    });
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (err) {
        console.warn('Logout request failed or timed out', err);
      }
    }

    clearClientSession();
    setUser(null);
    setToken(null);
    setActiveNav('booking');
    setNotice({
      type: 'info',
      message: 'You have been logged out successfully. Local token cleared.'
    });
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Type A: If user is unauthenticated on initial visit, welcome them with Login Modal
    if (!token && !user) {
      setIsLoginOpen(true);
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <AppLayout
        activeNav={activeNav}
        userRole={user?.role || null}
        userName={user?.fullName || null}
        userEmail={user?.email || null}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
      {/* Interactive Navigation / Feedback Banner */}
      {notice && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 shadow-sm ${
            notice.type === 'success'
              ? 'border-cyan-200 bg-cyan-50/90 text-cyan-900 shadow-cyan-100/40'
              : 'border-pink-200 bg-pink-50/90 text-pink-900 shadow-pink-100/40'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-cyan-600" />
          ) : (
            <Info className="h-5 w-5 shrink-0 mt-0.5 text-pink-600" />
          )}
          <div className="flex-1 text-sm font-medium">{notice.message}</div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Customer My Bookings View (F-05, AC-05) */}
      {activeNav === 'my-bookings' && (
        <MyBookingsView
          token={token}
          onSelectBooking={(bookingId) => {
            setDetailBookingId(bookingId);
            setIsDetailOpen(true);
          }}
          onBookNewRoom={() => setActiveNav('booking')}
        />
      )}

      {/* Staff Master Schedule View (F-06, AC-06) */}
      {activeNav === 'staff-schedule' && (
        <StaffMasterScheduleView
          token={token}
          selectedDate={selectedDate}
          onDateChange={(newDate) => setSelectedDate(newDate)}
          onSelectBooking={(bookingId) => {
            setDetailBookingId(bookingId);
            setIsDetailOpen(true);
          }}
        />
      )}

      {/* Main Booking & Availability View */}
      {activeNav === 'booking' && (
        <div className="space-y-6">
          {/* View Mode & Date Selection Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/70">
            {/* View Switcher: Browse Rooms vs Time Slot Matrix (w-fit self-start hugs buttons cleanly with zero blank overflow) */}
            <div className="inline-flex w-fit self-start rounded-2xl bg-white/80 p-1 border border-pink-100/90 shadow-xs backdrop-blur-md">
              <button
                onClick={() => setViewMode('rooms')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  viewMode === 'rooms'
                    ? 'bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 text-purple-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Browse Rooms</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 text-purple-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Time Slot Matrix</span>
              </button>
            </div>

            {/* Global Date Selector (Minimal Custom Popover Calendar) */}
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              onClear={() => setSelectedDate(getBangkokTodayString())}
              label="Date:"
            />
          </div>

          {/* Active View: Either Room Catalog OR Availability Matrix (Never stacked redundantly) */}
          {viewMode === 'rooms' ? (
            <RoomCatalog
              rooms={rooms}
              isLoading={isLoadingRooms}
              onBookRoom={(roomId) => {
                setBookingRoomId(roomId);
                setBookingSlot(0);
                setIsBookingOpen(true);
              }}
            />
          ) : (
            <AvailabilityMatrix
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              availability={availability}
              isLoading={isLoadingAvailability}
              error={availabilityError}
              onSelectSlot={(roomId, slotIndex) => {
                setBookingRoomId(roomId);
                setBookingSlot(slotIndex);
                setIsBookingOpen(true);
              }}
            />
          )}
        </div>
      )}

      {/* Customer-Facing Experience Highlights */}
      <div className="mt-14 pt-8 border-t border-pink-100/70">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-purple-900 bg-gradient-to-r from-pink-100 via-purple-100 to-sky-100 px-3 py-1 rounded-full border border-purple-200/50 shadow-2xs">
            <Sparkles className="h-3 w-3 text-purple-600" />
            <span>The SingSlot Experience</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Designed for Unforgettable Singing Moments
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Studio-quality acoustics, instant online reservation, and complete privacy for your party.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <GlassCard className="transition-all hover:border-pink-300 hover:shadow-md hover:shadow-pink-100/50 hover:-translate-y-0.5">
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 via-rose-100 to-pink-50 text-pink-600 border border-pink-200/70 shadow-xs">
                <Mic2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Private Soundproof Suites</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600">Crystal-Clear Acoustics</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              9 bespoke soundproof suites equipped with studio audio, wireless mics, and ambient lighting tailored for 4 to 12 guests.
            </p>
          </GlassCard>

          <GlassCard className="transition-all hover:border-purple-300 hover:shadow-md hover:shadow-purple-100/50 hover:-translate-y-0.5">
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 via-indigo-100 to-purple-50 text-purple-600 border border-purple-200/70 shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Flexible 1–5 Hour Sessions</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Zero Double-Booking</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Reserve contiguous hours with real-time conflict prevention, ensuring your preferred room is locked in exclusively for you.
            </p>
          </GlassCard>

          <GlassCard className="transition-all hover:border-sky-300 hover:shadow-md hover:shadow-sky-100/50 hover:-translate-y-0.5">
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-cyan-100 to-blue-50 text-sky-600 border border-sky-200/70 shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Instant Confirmation</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Fast Reception Check-In</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Immediate unique booking code generation with zero wait time. Present your reservation voucher at the door and sing right away.
            </p>
          </GlassCard>
        </div>
      </div>
    </AppLayout>

    {/* Viewport-Root Modals (Rendered outside layout stacking context to guarantee full screen overlay and no click leaks) */}
    <LoginModal
      isOpen={isLoginOpen}
      onClose={() => setIsLoginOpen(false)}
      onLoginSuccess={handleLoginSuccess}
    />

    <BookingModal
      isOpen={isBookingOpen}
      onClose={() => setIsBookingOpen(false)}
      rooms={rooms}
      selectedRoomId={bookingRoomId}
      selectedDate={selectedDate}
      selectedSlot={bookingSlot}
      token={token}
      user={user}
      onBookingSuccess={(confirmed) => {
        setNotice({
          type: 'success',
          message: `Booking confirmed! Reservation code ${confirmed.bookingCode} for ${confirmed.timeRange} in Room ${confirmed.roomNumber}.`
        });
        setAvailabilityRefreshTrigger((prev) => prev + 1);
      }}
      onRequestLogin={() => setIsLoginOpen(true)}
    />

    <BookingDetailModal
      isOpen={isDetailOpen}
      onClose={() => setIsDetailOpen(false)}
      bookingId={detailBookingId}
      token={token}
    />
    </>
  );
};

export default App;
