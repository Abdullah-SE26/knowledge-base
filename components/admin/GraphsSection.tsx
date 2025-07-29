"use client";

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { LineChart } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DailyCreation {
  date: string;
  count: number;
}

export default function GraphsSection() {
  const [dailyCreations, setDailyCreations] = useState<DailyCreation[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setDailyCreations(data.dailyCreations || []);
      })
      .catch((err) => console.error("Failed to fetch daily creations", err));
  }, []);

  const labels = dailyCreations.map((item) => item.date);
  const data = {
    labels,
    datasets: [
      {
        label: "Articles Created",
        data: dailyCreations.map((item) => item.count),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  return (
    <section className="bg-white dark:bg-gray-800 p-6 rounded shadow-md mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <LineChart className="w-6 h-6 text-blue-500" />
          Daily Article Creations
        </h2>
      </div>

      {dailyCreations.length > 0 ? (
        <Line options={options} data={data} />
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Loading chart...</p>
      )}
    </section>
  );
}
