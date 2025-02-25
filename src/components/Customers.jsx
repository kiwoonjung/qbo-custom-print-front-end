import React, { useEffect, useState } from "react";
import axios from "axios";

const Customers = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const companyId = localStorage.getItem("companyId");

      try {
        const response = await axios.get(
          `https://quickbooks.api.intuit.com/v3/company/${companyId}/query?query=SELECT * FROM Customer`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        setCustomers(response.data.QueryResponse.Customer);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div>
      <h1>Customers</h1>
      <ul>
        {customers.map((customer) => (
          <li key={customer.Id}>{customer.DisplayName}</li>
        ))}
      </ul>
    </div>
  );
};

export default Customers;
