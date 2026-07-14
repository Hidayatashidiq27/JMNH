// Client sisi browser untuk berbicara dengan API kita sendiri (/api/*).
// Password admin disimpan di sessionStorage setelah login dan dikirim
// sebagai header pada setiap operasi tulis.
import { Transaction } from "../types";

const getAdminPass = () => sessionStorage.getItem("admin_pass") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  "x-admin-password": getAdminPass(),
});

const toError = async (res: Response) => {
  let message = `Terjadi kesalahan (kode ${res.status}).`;
  try {
    const data = await res.json();
    if (data?.error) message = data.error;
  } catch {
    /* body bukan JSON */
  }
  const err: any = new Error(message);
  err.status = res.status;
  return err;
};

export const login = async (password: string): Promise<boolean> => {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return res.ok;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const res = await fetch("/api/transactions");
  if (!res.ok) throw await toError(res);
  return res.json();
};

export const addTransaction = async (tr: Omit<Transaction, "id">): Promise<Transaction> => {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(tr),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
};

export const addTransactions = async (trs: Omit<Transaction, "id">[]): Promise<Transaction[]> => {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(trs),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
};

export const updateTransaction = async (tr: Transaction): Promise<Transaction> => {
  const res = await fetch(`/api/transactions?id=${encodeURIComponent(tr.id)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(tr),
  });
  if (!res.ok) throw await toError(res);
  return res.json();
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw await toError(res);
};
