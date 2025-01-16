import { useState, useEffect, useCallback } from 'react';
import { formatToIST } from '@/lib/timezone'; // Import the helper function

interface AttendanceStatus {
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export const useAttendanceMarking = (
  username: string,
  onAttendanceMarked: () => void
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRetryingLocation, setIsRetryingLocation] = useState(false);
  const [retryAction, setRetryAction] = useState<'checkin' | 'checkout' | null>(
    null
  );
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    checkedIn: false,
    checkedOut: false,
    checkInTime: null,
    checkOutTime: null,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Fetch Attendance Status
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchAttendanceStatus = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/attendance/status?username=${username}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: AttendanceStatus = await response.json();
      setAttendanceStatus(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch attendance status');
    } finally {
      setLoading(false);
    }
  }, [username]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Pinpoint Location (using watch)
  // ─────────────────────────────────────────────────────────────────────────────
  const getLocationPinpoint = async (
    desiredAccuracy = 10,
    maxWaitMs = 30000
  ): Promise<GeolocationPosition> => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      let bestPosition: GeolocationPosition | null = null;
      let watchId: number;

      const handleSuccess = (position: GeolocationPosition) => {
        if (
          !bestPosition ||
          position.coords.accuracy < bestPosition.coords.accuracy
        ) {
          bestPosition = position;
        }

        if (bestPosition.coords.accuracy <= desiredAccuracy) {
          navigator.geolocation.clearWatch(watchId);
          resolve(bestPosition);
        }
      };

      const handleError = (error: GeolocationPositionError) => {
        navigator.geolocation.clearWatch(watchId);
        reject(error);
      };

      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
      });

      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        if (bestPosition) {
          resolve(bestPosition); // Return the best we’ve got
        } else {
          reject(
            new Error(
              `Could not get a sufficiently accurate location within ${maxWaitMs}ms`
            )
          );
        }
      }, maxWaitMs);
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Mark Attendance
  // ─────────────────────────────────────────────────────────────────────────────
  const markAttendance = async (action: 'checkin' | 'checkout') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setIsRetryingLocation(false);
    setRetryAction(null);

    try {
      // Attempt to get the best-possible location
      const position = await getLocationPinpoint(10, 30000); 
      // ^ Adjust threshold or timeout as you see fit
      handleLocationSuccess(position, action);
    } catch (err: any) {
      handleLocationError(err, action);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Handle Location Success
  // ─────────────────────────────────────────────────────────────────────────────
  const handleLocationSuccess = async (
    position: GeolocationPosition,
    action: 'checkin' | 'checkout'
  ) => {
    const { latitude, longitude, accuracy } = position.coords;

    try {
      const response = await fetch(`/api/attendance/${action}?action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          date: new Date().toISOString().split('T')[0],
          checkInTime:
            action === 'checkin' ? formatToIST(new Date()) : undefined,
          checkOutTime:
            action === 'checkout' ? formatToIST(new Date()) : undefined,
          checkInLatitude: action === 'checkin' ? latitude : undefined,
          checkInLongitude: action === 'checkin' ? longitude : undefined,
          checkOutLatitude: action === 'checkout' ? latitude : undefined,
          checkOutLongitude: action === 'checkout' ? longitude : undefined,
          checkInAccuracy: action === 'checkin' ? accuracy : undefined,
          checkOutAccuracy: action === 'checkout' ? accuracy : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action}`);
      }

      const successData = await response.json();
      setSuccess(successData.message);
      onAttendanceMarked();
      fetchAttendanceStatus();
    } catch (e: any) {
      setError(e.message || `Failed to ${action} attendance`);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Handle Location Error
  // ─────────────────────────────────────────────────────────────────────────────
  const handleLocationError = (error: any, action: 'checkin' | 'checkout') => {
    let errorMessage = 'Could not retrieve location.';
    switch (error?.code) {
      case error?.PERMISSION_DENIED:
        errorMessage =
          'Location access was denied. Please allow location access to check in/out.';
        break;
      case error?.POSITION_UNAVAILABLE:
        errorMessage =
          "Location information is unavailable. Please ensure your device's location services are enabled.";
        break;
      case error?.TIMEOUT:
        errorMessage = 'The request to get location timed out. Please try again.';
        setRetryAction(action);
        break;
      default:
        // This could be a plain Error object from our "reject()"
        errorMessage = error.message
          ? error.message
          : 'An unknown error occurred while getting location.';
    }
    setError(errorMessage);
    setLoading(false);
    console.error('Geolocation error:', error);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Support for Retrying
  // ─────────────────────────────────────────────────────────────────────────────
  const retryGetLocation = () => {
    if (retryAction) {
      setError(null);
      setIsRetryingLocation(true);
      markAttendance(retryAction);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Fetch Attendance Status on Mount/Change
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAttendanceStatus();
  }, [fetchAttendanceStatus]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Return the Hook’s Public API
  // ─────────────────────────────────────────────────────────────────────────────
  return {
    markAttendance,
    loading,
    error,
    success,
    attendanceStatus,
    isRetryingLocation,
    retryGetLocation,
  };
};
