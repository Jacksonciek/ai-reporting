import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../api/client";

interface TransactionItem {
  id_transaksi: number;
  transaction_date: string | null;
  product_name: string | null;
  category: string | null;
  sales_quantity: number | null;
  unit_price: string | null;
  total_sales: string | null;
  city: string | null;
  salesperson: string | null;
  payment_status: string | null;
  payment_method: string | null;
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  useEffect(() => {
    api.get<TransactionItem[]>("/transactions").then((res) => setTransactions(res.data));
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Transactions</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Product</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Total Sales</th>
            <th>City</th>
            <th>Salesperson</th>
            <th>Status</th>
            <th>Method</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((trx) => (
            <tr key={trx.id_transaksi}>
              <td>{trx.id_transaksi}</td>
              <td>{trx.transaction_date ? dayjs(trx.transaction_date).format("DD MMM YYYY") : "-"}</td>
              <td>{trx.product_name ?? "-"}</td>
              <td>{trx.category ?? "-"}</td>
              <td>{trx.sales_quantity ?? "-"}</td>
              <td>{trx.total_sales ?? "-"}</td>
              <td>{trx.city ?? "-"}</td>
              <td>{trx.salesperson ?? "-"}</td>
              <td>{trx.payment_status ?? "-"}</td>
              <td>{trx.payment_method ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsPage;
