// U.S. jobs in Colleges, Universities and Professional Schools (NAICS 611310), annual averages.
// Source: BLS Quarterly Census of Employment and Wages (QCEW), U.S. totals (area US000),
// column annual_avg_emplvl, read from project/data/QCEW_611310_US_extract_2014_2025.csv.
// public = federal (own_code 1) + state (2) + local (3) government; private = own_code 5.
// 2025 may still be preliminary at BLS (not yet checked).
window.QCEW = [
  { year: 2014, public: 1691242, private: 1199869 },
  { year: 2015, public: 1712711, private: 1215412 },
  { year: 2016, public: 1722534, private: 1224941 },
  { year: 2017, public: 1742942, private: 1242128 },
  { year: 2018, public: 1751974, private: 1253844 },
  { year: 2019, public: 1773606, private: 1255518 },
  { year: 2020, public: 1733578, private: 1194048 },
  { year: 2021, public: 1711720, private: 1197956 },
  { year: 2022, public: 1740871, private: 1230421 },
  { year: 2023, public: 1797069, private: 1260085 },
  { year: 2024, public: 1838990, private: 1275273 },
  { year: 2025, public: 1865190, private: 1284992 },
];
