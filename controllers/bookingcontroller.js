import { formatResponse, generateBookingId, log } from '../utils/helpers.js';
import { isValidDate } from '../middleware/validation.js';
import validator from 'validator';

export class BookingController {
  constructor(pool, config) {
    this.pool = pool;
    this.config = config;
  }

  // Create Booking
  createBooking = async (req, res) => {
    try {
      const {
        userGender, userAge, permanentAddress, city, state, country, pincode,
        occupation, occupationEmail, gstNumber, roomDescription, checkInDate,
        checkOutDate, totalGuests, paymentMethod, paymentName, totalPayment, specialRequests
      } = req.body;
      
      // Validation
      if (!roomDescription || !checkInDate || !checkOutDate || 
          !totalGuests || !paymentMethod || !paymentName || !totalPayment) {
        return res.status(400).json(formatResponse(false, 'Missing required booking fields'));
      }
      
      if (!isValidDate(checkInDate) || !isValidDate(checkOutDate)) {
        return res.status(400).json(formatResponse(false, 'Invalid date format. Use YYYY-MM-DD'));
      }
      
      if (new Date(checkInDate) >= new Date(checkOutDate)) {
        return res.status(400).json(formatResponse(false, 'Check-out date must be after check-in date'));
      }
      
      if (totalGuests < 1 || totalGuests > 20) {
        return res.status(400).json(formatResponse(false, 'Number of guests must be between 1 and 20'));
      }
      
      const validPaymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json(formatResponse(false, 'Invalid payment method'));
      }
      
      if (occupationEmail && !validator.isEmail(occupationEmail)) {
        return res.status(400).json(formatResponse(false, 'Invalid occupation email format'));
      }
      
      if (isNaN(totalPayment) || totalPayment <= 0) {
        return res.status(400).json(formatResponse(false, 'Invalid total payment amount'));
      }
      
      const bookingId = generateBookingId();
      
      await this.pool.execute(`
        INSERT INTO bookings (
          booking_id, user_id, user_first_name, user_last_name, user_email, user_phone,
          user_gender, user_age, permanent_address, city, state, country, pincode,
          occupation, occupation_email, gst_number, room_description, check_in_date, 
          check_out_date, total_guests, payment_method, payment_name, total_payment, special_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bookingId, req.user.id, req.user.first_name, req.user.last_name,
        req.user.email, req.user.phone, userGender || null, userAge || null,
        permanentAddress?.trim() || null, city?.trim() || null, state?.trim() || null,
        country?.trim() || null, pincode?.trim() || null, occupation?.trim() || null,
        occupationEmail?.toLowerCase().trim() || null, gstNumber?.trim() || null,
        roomDescription.trim(), checkInDate, checkOutDate, totalGuests,
        paymentMethod, paymentName.trim(), parseFloat(totalPayment), specialRequests?.trim() || null
      ]);
      
      log('info', 'Booking created', { bookingId, userId: req.user.id, totalGuests });
      
      res.status(201).json(formatResponse(true, 'Booking created successfully', {
        bookingId,
        checkInDate,
        checkOutDate,
        totalPayment: parseFloat(totalPayment),
        totalGuests,
        status: 'confirmed',
        nextStep: 'Add guests using /api/booking/add-guest endpoint'
      }));
      
    } catch (error) {
      log('error', 'Booking creation error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  // Get Booking Details
  getBookingDetails = async (req, res) => {
    try {
      const { bookingId, lastName } = req.query;
      
      if (!bookingId || !lastName) {
        return res.status(400).json(formatResponse(false, 'Booking ID and user last name are required'));
      }
      
      const [bookings] = await this.pool.execute(
        'SELECT * FROM bookings WHERE booking_id = ? AND user_last_name = ?',
        [bookingId.trim(), lastName.trim()]
      );
      
      if (bookings.length === 0) {
        return res.status(404).json(formatResponse(false, 'Booking not found with provided booking ID and user last name'));
      }
      
      const booking = bookings[0];
      
      // Get all guests
      const [guests] = await this.pool.execute(
        'SELECT * FROM booking_guests WHERE booking_id = ? ORDER BY is_primary_guest DESC, created_at ASC',
        [bookingId]
      );
      
      // Get documents
      const [documents] = await this.pool.execute(
        'SELECT document_type, file_name, uploaded_at FROM booking_documents WHERE booking_id = ?',
        [bookingId]
      );
      
      log('info', 'Booking details retrieved', { bookingId, userLastName: lastName });
      
      res.json(formatResponse(true, 'Booking details retrieved successfully', {
        booking: {
          bookingId: booking.booking_id,
          userDetails: {
            firstName: booking.user_first_name,
            lastName: booking.user_last_name,
            email: booking.user_email,
            phone: booking.user_phone,
            gender: booking.user_gender,
            age: booking.user_age
          },
          address: {
            permanentAddress: booking.permanent_address,
            city: booking.city,
            state: booking.state,
            country: booking.country,
            pincode: booking.pincode
          },
          professional: {
            occupation: booking.occupation,
            occupationEmail: booking.occupation_email,
            gstNumber: booking.gst_number
          },
          bookingDetails: {
            roomDescription: booking.room_description,
            checkInDate: booking.check_in_date,
            checkOutDate: booking.check_out_date,
            totalGuests: booking.total_guests,
            paymentMethod: booking.payment_method,
            paymentName: booking.payment_name,
            totalPayment: parseFloat(booking.total_payment),
            bookingStatus: booking.booking_status,
            specialRequests: booking.special_requests
          },
          guests: guests.map(guest => ({
            id: guest.id,
            firstName: guest.guest_first_name,
            lastName: guest.guest_last_name,
            age: guest.guest_age,
            gender: guest.guest_gender,
            idType: guest.guest_id_type,
            idNumber: guest.guest_id_number,
            isPrimaryGuest: guest.is_primary_guest,
            addedAt: guest.created_at
          })),
          createdAt: booking.created_at,
          updatedAt: booking.updated_at
        },
        documents: documents.map(doc => ({
          type: doc.document_type,
          fileName: doc.file_name,
          uploadedAt: doc.uploaded_at
        })),
        summary: {
          totalGuests: guests.length,
          primaryGuest: guests.find(g => g.is_primary_guest),
          documentsUploaded: documents.length
        }
      }));
      
    } catch (error) {
      log('error', 'Get booking details error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  // Update Personal Details
  updatePersonalDetails = async (req, res) => {
    try {
      const { 
        bookingId, userFirstName, userGender, userAge, permanentAddress,
        city, state, country, pincode, occupation, occupationEmail, gstNumber, specialRequests
      } = req.body;
      
      if (!bookingId) {
        return res.status(400).json(formatResponse(false, 'Booking ID is required'));
      }
      
      const [existingBookings] = await this.pool.execute(
        'SELECT id FROM bookings WHERE booking_id = ? AND user_id = ?',
        [bookingId.trim(), req.user.id]
      );
      
      if (existingBookings.length === 0) {
        return res.status(404).json(formatResponse(false, 'Booking not found or access denied'));
      }
      
      // Validation
      if (userAge && (userAge < 1 || userAge > 120)) {
        return res.status(400).json(formatResponse(false, 'Age must be between 1 and 120'));
      }
      
      if (userGender && !['male', 'female', 'other'].includes(userGender)) {
        return res.status(400).json(formatResponse(false, 'Invalid gender value'));
      }
      
      if (occupationEmail && !validator.isEmail(occupationEmail)) {
        return res.status(400).json(formatResponse(false, 'Invalid occupation email format'));
      }
      
      await this.pool.execute(`
        UPDATE bookings 
        SET 
          user_first_name = COALESCE(?, user_first_name),
          user_gender = COALESCE(?, user_gender),
          user_age = COALESCE(?, user_age),
          permanent_address = COALESCE(?, permanent_address),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          country = COALESCE(?, country),
          pincode = COALESCE(?, pincode),
          occupation = COALESCE(?, occupation),
          occupation_email = COALESCE(?, occupation_email),
          gst_number = COALESCE(?, gst_number),
          special_requests = COALESCE(?, special_requests),
          updated_at = NOW()
        WHERE booking_id = ? AND user_id = ?
      `, [
        userFirstName?.trim() || null, userGender || null, userAge || null,
        permanentAddress?.trim() || null, city?.trim() || null, state?.trim() || null,
        country?.trim() || null, pincode?.trim() || null, occupation?.trim() || null,
        occupationEmail?.toLowerCase().trim() || null, gstNumber?.trim() || null,
        specialRequests?.trim() || null, bookingId.trim(), req.user.id
      ]);
      
      log('info', 'Booking personal details updated', { bookingId, userId: req.user.id });
      
      res.json(formatResponse(true, 'Booking personal details updated successfully (phone and email are protected)', {
        restrictedFields: ['user_email', 'user_phone', 'user_last_name'],
        note: 'Phone number, email, and last name cannot be updated for security reasons'
      }));
      
    } catch (error) {
      log('error', 'Update booking personal details error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  // Add Guest
  addGuest = async (req, res) => {
    try {
      const {
        bookingId, guestFirstName, guestLastName, guestAge,
        guestGender, guestIdType, guestIdNumber, isPrimaryGuest = false
      } = req.body;
      
      if (!bookingId || !guestFirstName || !guestLastName) {
        return res.status(400).json(formatResponse(false, 'Booking ID, guest first name, and last name are required'));
      }
      
      const [bookings] = await this.pool.execute(
        'SELECT id, total_guests FROM bookings WHERE booking_id = ? AND user_id = ?',
        [bookingId.trim(), req.user.id]
      );
      
      if (bookings.length === 0) {
        return res.status(404).json(formatResponse(false, 'Booking not found or access denied'));
      }
      
      // Check guest count
      const [guestCount] = await this.pool.execute(
        'SELECT COUNT(*) as count FROM booking_guests WHERE booking_id = ?',
        [bookingId.trim()]
      );
      
      if (guestCount[0].count >= bookings[0].total_guests) {
        return res.status(400).json(formatResponse(false, `Maximum ${bookings[0].total_guests} guests allowed for this booking`));
      }
      
      // Validation
      if (guestAge && (guestAge < 1 || guestAge > 120)) {
        return res.status(400).json(formatResponse(false, 'Guest age must be between 1 and 120'));
      }
      
      if (guestGender && !['male', 'female', 'other'].includes(guestGender)) {
        return res.status(400).json(formatResponse(false, 'Invalid guest gender'));
      }
      
      if (guestIdType && !['aadhar', 'passport', 'driving_license', 'voter_id'].includes(guestIdType)) {
        return res.status(400).json(formatResponse(false, 'Invalid guest ID type'));
      }
      
      // If primary guest, remove primary status from others
      if (isPrimaryGuest) {
        await this.pool.execute(
          'UPDATE booking_guests SET is_primary_guest = FALSE WHERE booking_id = ?',
          [bookingId.trim()]
        );
      }
      
      const [result] = await this.pool.execute(`
        INSERT INTO booking_guests (
          booking_id, guest_first_name, guest_last_name, guest_age, 
          guest_gender, guest_id_type, guest_id_number, is_primary_guest
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bookingId.trim(), guestFirstName.trim(), guestLastName.trim(),
        guestAge || null, guestGender || null, guestIdType || null,
        guestIdNumber?.trim() || null, isPrimaryGuest
      ]);
      
      log('info', 'Guest added to booking', { 
        bookingId, guestId: result.insertId, guestName: `${guestFirstName} ${guestLastName}`, isPrimaryGuest
      });
      
      res.status(201).json(formatResponse(true, 'Guest added successfully', {
        guestId: result.insertId,
        guestName: `${guestFirstName.trim()} ${guestLastName.trim()}`,
        isPrimaryGuest,
        totalGuests: guestCount[0].count + 1
      }));
      
    } catch (error) {
      log('error', 'Add guest error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  // Update Guest
  updateGuest = async (req, res) => {
    try {
      const {
        bookingId, guestId, guestFirstName, guestLastName, guestAge,
        guestGender, guestIdType, guestIdNumber, isPrimaryGuest
      } = req.body;
      
      if (!bookingId || !guestId) {
        return res.status(400).json(formatResponse(false, 'Booking ID and guest ID are required'));
      }
      
      const [guests] = await this.pool.execute(`
        SELECT bg.id 
        FROM booking_guests bg 
        JOIN bookings b ON bg.booking_id = b.booking_id 
        WHERE bg.booking_id = ? AND bg.id = ? AND b.user_id = ?
      `, [bookingId.trim(), guestId, req.user.id]);
      
      if (guests.length === 0) {
        return res.status(404).json(formatResponse(false, 'Guest not found or access denied'));
      }
      
      await this.pool.execute(`
        UPDATE booking_guests 
        SET 
          guest_first_name = COALESCE(?, guest_first_name),
          guest_last_name = COALESCE(?, guest_last_name),
          guest_age = COALESCE(?, guest_age),
          guest_gender = COALESCE(?, guest_gender),
          guest_id_type = COALESCE(?, guest_id_type),
          guest_id_number = COALESCE(?, guest_id_number),
          is_primary_guest = COALESCE(?, is_primary_guest)
        WHERE id = ? AND booking_id = ?
      `, [
        guestFirstName?.trim() || null, guestLastName?.trim() || null, guestAge || null,
        guestGender || null, guestIdType || null, guestIdNumber?.trim() || null,
        isPrimaryGuest !== undefined ? isPrimaryGuest : null, guestId, bookingId.trim()
      ]);
      
      log('info', 'Guest details updated', { bookingId, guestId });
      
      res.json(formatResponse(true, 'Guest details updated successfully'));
      
    } catch (error) {
      log('error', 'Update guest error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };

  // Delete Guest
  deleteGuest = async (req, res) => {
    try {
      const { bookingId, guestId } = req.body;
      
      if (!bookingId || !guestId) {
        return res.status(400).json(formatResponse(false, 'Booking ID and guest ID are required'));
      }
      
      const [guests] = await this.pool.execute(`
        SELECT bg.id, bg.guest_first_name, bg.guest_last_name, bg.is_primary_guest
        FROM booking_guests bg 
        JOIN bookings b ON bg.booking_id = b.booking_id 
        WHERE bg.booking_id = ? AND bg.id = ? AND b.user_id = ?
      `, [bookingId.trim(), guestId, req.user.id]);
      
      if (guests.length === 0) {
        return res.status(404).json(formatResponse(false, 'Guest not found or access denied'));
      }
      
      const guest = guests[0];
      
      await this.pool.execute(
        'DELETE FROM booking_guests WHERE id = ? AND booking_id = ?',
        [guestId, bookingId.trim()]
      );
      
      log('info', 'Guest deleted from booking', { 
        bookingId, guestId, guestName: `${guest.guest_first_name} ${guest.guest_last_name}`, wasPrimary: guest.is_primary_guest
      });
      
      res.json(formatResponse(true, 'Guest removed successfully', {
        deletedGuest: `${guest.guest_first_name} ${guest.guest_last_name}`,
        wasPrimaryGuest: guest.is_primary_guest
      }));
      
    } catch (error) {
      log('error', 'Delete guest error', { error: error.message });
      res.status(500).json(formatResponse(false, 'Internal server error'));
    }
  };
}
