// http://jsfiddle.net/4KVL2/36/
var charts = {};

function plotData(data, options, divId) {
    if (charts.hasOwnProperty(divId)) {
        var chart = charts[divId];
        chart.series[0].remove(false);
        chart.addSeries({
            type: 'area',
            name: options.yAxisTitle,
            data: data
        });
        chart.redraw(true);
    }
    else {
        function createYAxis(options) {
            var res = {
                title: {
                    text: options.yAxisTitle
                }
            }
            if (typeof options.yTickPositions != "undefined") {
                res.tickPositions = options.yTickPositions;
            }
            return res;
        };
        charts[divId] = new Highcharts.chart(divId, {
            chart: {
                zoomType: 'x'
            },
            title: {
                text: options.title
            },
            subtitle: {
                text: "select some area to zoom"
            },
            xAxis: {
                type: 'datetime'
            },
            yAxis: createYAxis(options),
            legend: {
                enabled: false
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                }
            },

            series: [{
                type: 'area',
                name: options.yAxisTitle,
                data: data
            }]
        });
    }
}
