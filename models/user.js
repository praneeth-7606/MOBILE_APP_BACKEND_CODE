// import validator from 'validator';
// import { isValidPhone } from '../utils/helpers.js';

// export class User {
//   constructor(pool) {
//     this.pool = pool;
//   }

//   async findByEmail(email) {
//     if (!validator.isEmail(email)) return null;
    
//     const [rows] = await this.pool.execute('SELECT * FROM users WHERE email = ?', [email]);
//     return rows.length > 0 ? rows[0] : null;
//   }

//   async findByPhone(phone) {
//     if (!isValidPhone(phone)) return null;
    
//     const [rows] = await this.pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);
//     return rows.length > 0 ? rows[0] : null;
//   }

//   async findById(id) {
//     const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [id]);
//     return rows.length > 0 ? rows[0] : null;
//   }

//   async findByIdentifier(identifier, loginMethod) {
//     if (loginMethod === 'email') {
//       return await this.findByEmail(identifier);
//     } else if (loginMethod === 'phone') {
//       return await this.findByPhone(identifier);
//     }
//     return null;
//   }

//   async createUser(identifier, loginMethod) {
//     if (loginMethod === 'email' && validator.isEmail(identifier)) {
//       const [result] = await this.pool.execute(
//         'INSERT INTO users (email, login_method, profile_completed) VALUES (?, ?, FALSE)',
//         [identifier.toLowerCase().trim(), 'email']
//       );
//       return result.insertId;
//     }
    
//     if (loginMethod === 'phone' && isValidPhone(identifier)) {
//       const [result] = await this.pool.execute(
//         'INSERT INTO users (phone, login_method, profile_completed) VALUES (?, ?, FALSE)',
//         [identifier, 'phone']
//       );
//       return result.insertId;
//     }
    
//     return null;
//   }

//   async findOrCreate(identifier, loginMethod) {
//     let user = await this.findByIdentifier(identifier, loginMethod);
    
//     if (!user) {
//       const userId = await this.createUser(identifier, loginMethod);
//       if (userId) {
//         user = await this.findById(userId);
//       }
//     }
    
//     return user;
//   }

//   async updateProfile(userId, profileData) {
//     const { firstName, lastName, email, phone, marketingConsent } = profileData;
    
//     const updateQuery = `
//       UPDATE users 
//       SET first_name = ?, last_name = ?, email = COALESCE(?, email), phone = COALESCE(?, phone), 
//           marketing_consent = ?, profile_completed = TRUE, updated_at = NOW() 
//       WHERE id = ?
//     `;
    
//     await this.pool.execute(updateQuery, [
//       firstName.trim(),
//       lastName.trim(),
//       email ? email.toLowerCase().trim() : null,
//       phone || null,
//       marketingConsent || false,
//       userId
//     ]);
    
//     return await this.findById(userId);
//   }

//   async checkEmailExists(email, excludeUserId = null) {
//     if (excludeUserId) {
//       const [rows] = await this.pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase(), excludeUserId]);
//       return rows.length > 0;
//     }
    
//     const [rows] = await this.pool.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
//     return rows.length > 0;
//   }

//   async checkPhoneExists(phone, excludeUserId = null) {
//     if (excludeUserId) {
//       const [rows] = await this.pool.execute('SELECT id FROM users WHERE phone = ? AND id != ?', [phone, excludeUserId]);
//       return rows.length > 0;
//     }
    
//     const [rows] = await this.pool.execute('SELECT id FROM users WHERE phone = ?', [phone]);
//     return rows.length > 0;
//   }
// }



import validator from 'validator';
import { isValidPhone } from '../middleware/validation.js';

export class User {
  constructor(pool) {
    this.pool = pool;
  }

  async findByIdentifier(identifier, loginMethod) {
    try {
      if (loginMethod === 'email' && validator.isEmail(identifier)) {
        const [rows] = await this.pool.execute('SELECT * FROM users WHERE email = ?', [identifier]);
        return rows.length > 0 ? rows[0] : null;
      }
      
      if (loginMethod === 'phone' && isValidPhone(identifier)) {
        const [rows] = await this.pool.execute('SELECT * FROM users WHERE phone = ?', [identifier]);
        return rows.length > 0 ? rows[0] : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding user by identifier:', error.message);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      if (!validator.isEmail(email)) return null;
      
      const [rows] = await this.pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error.message);
      throw error;
    }
  }

  async findByPhone(phone) {
    try {
      if (!isValidPhone(phone)) return null;
      
      const [rows] = await this.pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by phone:', error.message);
      throw error;
    }
  }

  async findById(id) {
    try {
      const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error.message);
      throw error;
    }
  }

  async create(identifier, loginMethod) {
    try {
      if (loginMethod === 'email' && validator.isEmail(identifier)) {
        const [result] = await this.pool.execute(
          'INSERT INTO users (email, login_method, profile_completed) VALUES (?, ?, FALSE)',
          [identifier.toLowerCase().trim(), 'email']
        );
        return result.insertId;
      }
      
      if (loginMethod === 'phone' && isValidPhone(identifier)) {
        const [result] = await this.pool.execute(
          'INSERT INTO users (phone, login_method, profile_completed) VALUES (?, ?, FALSE)',
          [identifier, 'phone']
        );
        return result.insertId;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw error;
    }
  }

  async findOrCreate(identifier, loginMethod) {
    try {
      let user = await this.findByIdentifier(identifier, loginMethod);
      
      if (!user) {
        if (loginMethod === 'email' && validator.isEmail(identifier)) {
          const userId = await this.create(identifier, 'email');
          const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
          user = rows[0];
        } else if (loginMethod === 'phone' && isValidPhone(identifier)) {
          const userId = await this.create(identifier, 'phone');
          const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
          user = rows[0];
        }
      }
      
      return user;
    } catch (error) {
      console.error('Error finding or creating user:', error.message);
      throw error;
    }
  }

  async updateProfile(userId, profileData) {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        marketingConsent
      } = profileData;

      const updateQuery = `
        UPDATE users 
        SET first_name = ?, last_name = ?, email = COALESCE(?, email), phone = COALESCE(?, phone), 
            marketing_consent = ?, profile_completed = TRUE, updated_at = NOW() 
        WHERE id = ?
      `;

      await this.pool.execute(updateQuery, [
        firstName?.trim(),
        lastName?.trim(),
        email ? email.toLowerCase().trim() : null,
        phone || null,
        marketingConsent || false,
        userId
      ]);

      // Return updated user
      return await this.findById(userId);
    } catch (error) {
      console.error('Error updating user profile:', error.message);
      throw error;
    }
  }

  async checkEmailExists(email, excludeUserId = null) {
    try {
      if (!validator.isEmail(email)) return false;
      
      let query = 'SELECT id FROM users WHERE email = ?';
      let params = [email.toLowerCase()];
      
      if (excludeUserId) {
        query += ' AND id != ?';
        params.push(excludeUserId);
      }
      
      const [rows] = await this.pool.execute(query, params);
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking email exists:', error.message);
      throw error;
    }
  }

  async checkPhoneExists(phone, excludeUserId = null) {
    try {
      if (!isValidPhone(phone)) return false;
      
      let query = 'SELECT id FROM users WHERE phone = ?';
      let params = [phone];
      
      if (excludeUserId) {
        query += ' AND id != ?';
        params.push(excludeUserId);
      }
      
      const [rows] = await this.pool.execute(query, params);
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking phone exists:', error.message);
      throw error;
    }
  }

  async setEmailVerified(userId, verified = true) {
    try {
      await this.pool.execute(
        'UPDATE users SET email_verified = ?, updated_at = NOW() WHERE id = ?',
        [verified, userId]
      );
    } catch (error) {
      console.error('Error setting email verified:', error.message);
      throw error;
    }
  }

  async setPhoneVerified(userId, verified = true) {
    try {
      await this.pool.execute(
        'UPDATE users SET phone_verified = ?, updated_at = NOW() WHERE id = ?',
        [verified, userId]
      );
    } catch (error) {
      console.error('Error setting phone verified:', error.message);
      throw error;
    }
  }

  async getAllUsers(limit = 50, offset = 0) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT id, email, phone, first_name, last_name, login_method, profile_completed, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return rows;
    } catch (error) {
      console.error('Error getting all users:', error.message);
      throw error;
    }
  }

  async getUserStats() {
    try {
      const [totalUsers] = await this.pool.execute('SELECT COUNT(*) as total FROM users');
      const [emailUsers] = await this.pool.execute('SELECT COUNT(*) as count FROM users WHERE login_method = "email"');
      const [phoneUsers] = await this.pool.execute('SELECT COUNT(*) as count FROM users WHERE login_method = "phone"');
      const [completedProfiles] = await this.pool.execute('SELECT COUNT(*) as count FROM users WHERE profile_completed = TRUE');
      
      return {
        total: totalUsers[0].total,
        emailUsers: emailUsers[0].count,
        phoneUsers: phoneUsers[0].count,
        completedProfiles: completedProfiles[0].count
      };
    } catch (error) {
      console.error('Error getting user stats:', error.message);
      throw error;
    }
  }
}



// import validator from 'validator';
// import { isValidPhone } from '../middleware/validation.js';

// export class User {
//   constructor(pool) {
//     this.pool = pool;
//   }

//   async findByIdentifier(identifier, loginMethod) {
//     if (loginMethod === 'email' && validator.isEmail(identifier)) {
//       const [rows] = await this.pool.execute('SELECT * FROM users WHERE email = ?', [identifier]);
//       return rows.length > 0 ? rows[0] : null;
//     }
    
//     if (loginMethod === 'phone' && isValidPhone(identifier)) {
//       const [rows] = await this.pool.execute('SELECT * FROM users WHERE phone = ?', [identifier]);
//       return rows.length > 0 ? rows[0] : null;
//     }
    
//     return null;
//   }

//   async create(identifier, loginMethod) {
//     if (loginMethod === 'email') {
//       const [result] = await this.pool.execute(
//         'INSERT INTO users (email, login_method, profile_completed) VALUES (?, ?, FALSE)',
//         [identifier.toLowerCase().trim(), 'email']
//       );
//       return result.insertId;
//     }
    
//     if (loginMethod === 'phone') {
//       const [result] = await this.pool.execute(
//         'INSERT INTO users (phone, login_method, profile_completed) VALUES (?, ?, FALSE)',
//         [identifier, 'phone']
//       );
//       return result.insertId;
//     }
    
//     return null;
//   }

//   async findOrCreate(identifier, loginMethod) {
//     let user = await this.findByIdentifier(identifier, loginMethod);
    
//     if (!user) {
//       if (loginMethod === 'email' && validator.isEmail(identifier)) {
//         const userId = await this.create(identifier, 'email');
//         const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
//         user = rows[0];
//       } else if (loginMethod === 'phone' && isValidPhone(identifier)) {
//         const userId = await this.create(identifier, 'phone');
//         const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
//         user = rows[0];
//       }
//     }
    
//     return user;
//   }
// }