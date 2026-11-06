import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { PageHeader } from './components/layout/PageHeader';
import { GlassCard } from './components/layout/GlassCard';
import { LoginModal } from './components/auth/LoginModal';
import { RoomCatalog } from './components/room/RoomCatalog';
import { AvailabilityMatrix } from './components/room/AvailabilityMatrix';
import { BookingModal } from './components/booking/BookingModal';
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
  User as UserIcon,
  Sparkles
} from 'lucide-react';

type NavRoute = 'booking' | 'my-bookings' | 'staff-schedule' | 'login';

export const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavRoute>('booking');
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

  return (
    <AppLayout
      activeNav={activeNav}
      userRole={user?.role || null}
      userName={user?.fullName || null}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      <PageHeader
        badge={user ? `Authenticated as ${user.role}` : 'Issue #4 Active: Online Booking Engine & Contiguous Validation'}
        title="SingSlot Karaoke System"
        subtitle="Explore our 9 private karaoke rooms across 3 capacity tiers, check real-time availability, and reserve 1–5 contiguous hours online."
      />

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

      {/* Active Session Card if Logged In */}
      {user && (
        <div className="mb-8">
          <GlassCard className="border-pink-200/90 bg-gradient-to-r from-pink-50/90 via-purple-50/80 to-sky-50/80 shadow-md shadow-purple-100/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600 border border-pink-200 shadow-sm">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">{user.fullName}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide shadow-sm ${
                        user.role === 'STAFF'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-pink-100 text-pink-700 border border-pink-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-rose-200 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 shadow-sm transition-colors"
                >
                  Terminate Session
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Main Booking & Availability View */}
      {activeNav === 'booking' && (
        <div className="space-y-8">
          {/* 1. Server-Calculated Availability Grid (F-03, AC-03) with Interactive Booking Trigger */}
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

          {/* 2. Room Fleet Catalog (F-02, AC-02) */}
          <RoomCatalog
            rooms={rooms}
            isLoading={isLoadingRooms}
            onBookRoom={(roomId) => {
              setBookingRoomId(roomId);
              setBookingSlot(0);
              setIsBookingOpen(true);
            }}
          />
        </div>
      )}

      {/* Feature Architecture Cards */}
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <GlassCard>
          <div className="flex items-center gap-3 mb-4 text-pink-400">
            <Mic2 className="h-6 w-6" />
            <h3 className="text-lg font-bold text-slate-800">Seeded Fleet (F-02)</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            9 private rooms across Small (4 pax), Medium (8 pax), and Large (12 pax) tiers operating 10:00 to 24:00 daily.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-4 text-purple-400">
            <Calendar className="h-6 w-6" />
            <h3 className="text-lg font-bold text-slate-800">14 Hourly Slots (F-03)</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Discrete 0-indexed hourly slots (0..13) allowing 1 to 5 contiguous hours with strict zero-overlap locks.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-4 text-sky-400">
            <ShieldCheck className="h-6 w-6" />
            <h3 className="text-lg font-bold text-slate-800">Role Isolation (RBAC)</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            JWT verification with 8-hour lifetime enforcing CUSTOMER vs. STAFF role boundaries and data privacy.
          </p>
        </GlassCard>
      </div>

      <div className="mt-8">
        <GlassCard className="border-pink-100/80 bg-white/80 shadow-xs">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-pink-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-600">
              Issue #4 Online Booking Engine and Contiguous Validation active. Ready for Issue #5 Conflict Prevention.
            </span>
          </div>
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
  );
};

export default App;
