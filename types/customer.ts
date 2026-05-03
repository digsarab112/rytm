export type CustomerAccount = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSession = {
  customerId: string;
  name: string;
  email: string;
  createdAt: string;
};
