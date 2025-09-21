export function getTransactionColor(value: number): string {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
}

export type ChartThemeColors = {
    labelColor: string
    legendTextColor: string
    axisLabelColor: string
    tooltipBackground: string
    tooltipBorder: string
    tooltipText: string
}

export function getChartThemeColors(): ChartThemeColors {
    const colorMode = useColorMode()
    const isDark = colorMode.value === 'dark'

    const labelColor = isDark ? '#e5e7eb' : '#374151'
    const legendTextColor = labelColor
    const axisLabelColor = labelColor
    const tooltipBackground = isDark ? '#111827' : '#ffffff'
    const tooltipBorder = isDark ? '#374151' : '#e5e7eb'
    const tooltipText = isDark ? '#e5e7eb' : '#111827'

    return {
        labelColor,
        legendTextColor,
        axisLabelColor,
        tooltipBackground,
        tooltipBorder,
        tooltipText
    }
}
