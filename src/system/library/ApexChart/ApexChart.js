import { themeColors } from '@/assets/utils/themeColors.js'

// revenueChart
export const revenueChart = {
    chart: {
        height: 250,
        type: 'line',
        zoom: {
            enabled: false,
        },
        toolbar: {
            show: false,
        },
    },
    colors: [themeColors.green],
    dataLabels: {
        enabled: false,
    },
    stroke: {
        width: [2, 2, 2],
        curve: 'smooth',
    },
    grid: {
        row: {
            colors: ['transparent', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0.5,
        },
    },
    series:[],
    xaxis: {
        categories: [],
    },
    tooltip: {
        y: {
            formatter: function (val) {
                return 'RM ' + val
            },
        },
    },
}

// goalChart
export const goalChart = {
    series: [],
    labels: [],
    chart: {
        height: 220,
        type: 'radialBar',
        offsetY: -10,
    },
    colors: [themeColors.accent, themeColors.green],
    plotOptions: {
        radialBar: {
            startAngle: -135,
            endAngle: 135,
            inverseOrder: true,
            dataLabels: {
                show: true,
                name: {
                    show: true,
                    fontSize: '14px',
                    fontWeight: 500,
                    offsetY: -10,
                },
                value: {
                    show: true,
                    fontWeight: 600,
                    color: themeColors.lightText,
                    fontSize: '16px',
                    offsetY: -5,
                },
                total: {
                    show: true,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: themeColors.lightText,
                },
            },
            hollow: {
                margin: 15,
                size: '75%',
            },
            track: {
                strokeWidth: '100%',
            },
        },
    },
    stroke: {
        lineCap: 'round',
    },
}

// growthRadialChart
export const growthRadialChart = {
    series: [],
    labels: [],
    chart: {
        height: 160,
        type: 'radialBar',
        toolbar: {
            show: false,
        },
    },
    colors: [themeColors.accent],
    plotOptions: {
        radialBar: {
            hollow: {
                size: '75%',
            },
            dataLabels: {
                show: true,
                name: {
                    show: true,
                    fontSize: '14px',
                    fontWeight: 500,
                    offsetY: -10,
                    color: themeColors.lightText,
                },
                value: {
                    show: true,
                    fontWeight: 600,
                    color: themeColors.purple,
                    fontSize: '16px',
                    offsetY: -5,
                },
            },
        },
    },
}
  
export const profitBarChart = {
    series: [],
    xaxis: {
        categories: [],
    },
    chart: {
        height: 250,
        type: 'bar',
        toolbar: {
            show: false,
        },
    },
    colors: [themeColors.accent, themeColors.purple, themeColors.green],
    legend: {
        position: 'top',
    },
    plotOptions: {
        bar: {
            horizontal: false,
            endingShape: 'rounded',
            columnWidth: '55%',
        },
    },
    dataLabels: {
        enabled: false,
    },
    stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
    },
    yaxis: {
        labels: {
            formatter: function (val) {
                return val + 70
            },
        },
    },
    fill: {
        opacity: 1,
    },
    tooltip: {
        y: {
            formatter: function (val) {
                return val + 70
            },
        },
    },
}
