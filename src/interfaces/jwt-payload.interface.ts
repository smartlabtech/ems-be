export interface IJWTPayload {
  customer: {
    id: string,
    mobile: string,
    fullName: string,
    // last_name: string,
    email: string,
  },
  role: string,
}