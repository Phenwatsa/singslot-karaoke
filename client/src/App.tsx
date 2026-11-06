import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { GlassCard } from './components/layout/GlassCard';
import { LoginModal } from './components/auth/LoginModal';
import { RoomCatalog } from './components/room/RoomCatalog';
import { AvailabilityMatrix } from './components/room/AvailabilityMatrix';
import { BookingModal } from './components/booking/BookingModal';
import { SplashScreen } from './components/layout/SplashScreen';
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
  Calendar,
  ShieldCheck,
  Info,
  CheckCircle2,
  LayoutGrid,
  Clock
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
        setNotice(null);
        break;
      case 'my-bookings':
        setNotice({
          type: 'info',
          message: 'Notice: Customer booking history view will be activated in Issue #5.'
        });
        break;
      case 'staff-schedule':
        setNotice({
          type: 'info',
          message: 'Notice: Staff master schedule grid will be activated in Issue #6.'
        });
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

      {/* Main Booking & Availability View */}
      {activeNav === 'booking' && (
        <div className="space-y-6">
          {/* View Mode & Date Selection Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/70">
            {/* View Switcher: Browse Rooms vs Time Slot Matrix */}
            <div className="inline-flex rounded-2xl bg-white/80 p-1 border border-pink-100/90 shadow-xs backdrop-blur-md">
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

            {/* Global Date Selector */}
            <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-pink-200/80 bg-white/90 px-3.5 py-1.5 text-xs text-slate-700 shadow-xs hover:border-pink-300 transition-colors">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="font-semibold text-slate-500">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>
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

      {/* Customer-Facing Booking Highlights */}
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <GlassCard>
          <div className="flex items-center gap-3 mb-4 text-pink-400">
            <Mic2 className="h-6 w-6" />
            <h3 className="text-lg font-bold text-slate-800">Private Karaoke Suites</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            9 premium soundproof rooms across Small (4 pax), Medium (8 pax), and Large (12 pax) suites with pro audio setup.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-4 text-purple-400">
            <Clock className="h-6 w-6" />
            <h3 className="text-lg font-bold text-slate-800">1–5 Hours Contiguous Booking</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Reserve up to 5 contiguous hours in your preferred room with live availability and guaranteed zero double-booking.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-4 text-sky-400">
            <ShieldCheck className="h-6 w-6" />
            <h3 className="text-lg font-bold text-slate-800">Instant Online Confirmation</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Immediate booking code generation with automated reservation conflict protection and seamless check-in.
          </p>
        </GlassCard>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Online Booking Modal (F-04, AC-04a) */}
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
    </AppLayout>
    </>
  );
};

export default App;
