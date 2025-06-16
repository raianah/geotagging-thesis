import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const createUser = async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = {
    uid: uuidv4(),
    fullName: 'Juan Dela Cruz',
    emailAddress: 'juan.employee@balayan.gov.ph',
    password: hashedPassword,
    contactNumber: '09171234567',
    userCreated: new Date('2025-04-01T09:00:00+08:00').toISOString(),
    profilePicture: null,
    role: 'employee',
    location: null,
    latitude: null,
    longitude: null
  };

  console.log(user);
};

createUser();
