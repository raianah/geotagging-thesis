import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import ASFMap from "./ASFMap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../css/Navbar.css";
import "../css/EmployeeDashboard.css";

const EmployeeDashboard = ({ darkMode, setDarkMode }) => {
    const [showGraphModal, setShowGraphModal] = useState(false);
    const [selectedStat, setSelectedStat] = useState(null);
    const [animationDirection, setAnimationDirection] = useState(null);

    const statTypes = [
        'Total No. of Registered Hog Raisers',
        'Pending Applications',
        'ASF Outbreak Reports'
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showGraphModal) return;
            
            if (e.key === 'ArrowLeft') {
                navigateGraph('prev');
            } else if (e.key === 'ArrowRight') {
                navigateGraph('next');
            } else if (e.key === 'Escape') {
                closeGraphModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showGraphModal, selectedStat]);

    const handleCardClick = (stat) => {
        setAnimationDirection('fade-in');
        setSelectedStat(stat);
        setShowGraphModal(true);
    };

    const closeGraphModal = () => {
        setAnimationDirection('fade-out');
        setTimeout(() => {
            setShowGraphModal(false);
            setSelectedStat(null);
            setAnimationDirection(null);
        }, 200);
    };

    const navigateGraph = (direction) => {
        const currentIndex = statTypes.indexOf(selectedStat);
        let newIndex;
        
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % statTypes.length;
            setAnimationDirection('slide-left');
        } else {
            newIndex = (currentIndex - 1 + statTypes.length) % statTypes.length;
            setAnimationDirection('slide-right');
        }
        
        setTimeout(() => {
            setSelectedStat(statTypes[newIndex]);
            setAnimationDirection(null);
        }, 200);
    };

    // Generate data for the last 13 months
    const generateMonthlyData = () => {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth(); // 0-11
        
        const last13Months = [];
        
        // Loop backwards from current month to get the last 13 months
        for (let i = 0; i < 13; i++) {
            // Calculate the month index (handling wrap-around to previous year)
            const monthIndex = (currentMonth - i + 12) % 12;
            last13Months.unshift(months[monthIndex]);
        }
        
        // Create the chart data with realistic patterns
        return {
            'Total No. of Registered Hog Raisers': last13Months.map((month, index) => {
                // Generate semi-realistic data with an upward trend
                const baseValue = 7;
                const randomFactor = Math.floor(Math.random() * 5);
                const trendFactor = Math.floor(index * 0.7); // Slight upward trend
                return {
                    name: month,
                    value: baseValue + randomFactor + trendFactor
                };
            }),
            
            'Pending Applications': last13Months.map((month) => {
                // Random number between 1 and 5
                return {
                    name: month,
                    value: Math.floor(Math.random() * 5) + 1
                };
            }),
            
            'ASF Outbreak Reports': last13Months.map((month) => {
                // Mostly zeros with occasional outbreaks (1 or 2)
                const randomValue = Math.random();
                let value = 0;
                if (randomValue > 0.7) {
                    value = 1;
                } else if (randomValue > 0.95) {
                    value = 2;
                }
                return {
                    name: month,
                    value: value
                };
            })
        };
    };

    // Generate the chart data
    const chartData = generateMonthlyData();

    // Fixed stat values from the updated version
    const statValues = {
        'Total No. of Registered Hog Raisers': 38,
        'Pending Applications': 10,
        'ASF Outbreak Reports': 2,
        'Hogs Ready for Market': 10
    };

    // Custom tooltip component to prevent highlighting
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{`${label} : ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    // Get bar color based on stat type
    const getBarColor = (stat) => {
        const colors = {
            'Total No. of Registered Hog Raisers': '#4caf50',
            'Pending Applications': '#ff9800',
            'ASF Outbreak Reports': '#f44336'
        };
        return colors[stat] || '#ffcc00';
    };

    return (
        <div className='dashboard-wrapper'>
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

            <div className="dashboard-container">
                <div className="stats-section">
                    {statTypes.map((stat) => (
                        <div key={stat} className="stat-card" onClick={() => handleCardClick(stat)}>
                            <span>{statValues[stat]}</span>
                            <p>{stat}</p>
                        </div>
                    ))}
                </div>

                <div className="content-section">
                    <ASFMap />
                    <div className="quick-access">
                        <h3>Quick Access Tools:</h3>
                        <button>Register New Hog Raiser</button>
                        <button>View ASF Statistics</button>
                        <button>Report ASF Case</button>
                        <button>Assign Quarantine Zone</button>
                    </div>
                </div>
            </div>

            {showGraphModal && selectedStat && (
                <div className="graph-modal-overlay" onClick={closeGraphModal}>
                    <div className={`graph-modal-content ${animationDirection || ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="graph-modal-header">
                            <h2>{selectedStat}</h2>
                            <button className="close-btn" onClick={closeGraphModal}>×</button>
                        </div>
                        <div className="graph-modal-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData[selectedStat]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} cursor={false} />
                                    <Legend />
                                    <Bar dataKey="value" fill={getBarColor(selectedStat)} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="graph-navigation">
                            <button className="nav-btn prev-btn" onClick={() => navigateGraph('prev')}>
                                <ChevronLeft size={24} />
                            </button>
                            <div className="graph-indicators">
                                {statTypes.map((stat, index) => (
                                    <span 
                                        key={index} 
                                        className={`indicator ${selectedStat === stat ? 'active' : ''}`}
                                        onClick={() => {
                                            setAnimationDirection('fade-in');
                                            setTimeout(() => {
                                                setSelectedStat(stat);
                                                setAnimationDirection(null);
                                            }, 200);
                                        }}
                                    />
                                ))}
                            </div>
                            <button className="nav-btn next-btn" onClick={() => navigateGraph('next')}>
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;