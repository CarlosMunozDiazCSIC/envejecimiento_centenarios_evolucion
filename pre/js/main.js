import { numberWithCommas, numberWithCommas2 } from './helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from './tooltip';
import { getIframeParams } from './height';
import { setChartCanvas, setChartCanvasImage } from './modules/canvas-image';
import { setRRSSLinks } from './modules/rrss';
import './modules/tabs';
import 'url-search-params-polyfill';

//Desarrollo de la visualización
import * as d3 from 'd3';
import * as d3_reg from 'd3-regression';

//Necesario para importar los estilos de forma automática en la etiqueta 'style' del html final
import '../css/main.scss';

///// VISUALIZACIÓN DEL GRÁFICO //////
let dataSource = 'https://raw.githubusercontent.com/EnvejecimientoEnRed/envejecimiento_alzheimer_evolucion/main/data/tasa_nal_alz.csv';
let tooltip = d3.select('#tooltip');

//Variables para visualización
let innerData = [], chartBlock = d3.select('#chart'), chart, x_c, x_cAxis, y_c, y_cAxis;
let line, regressionGenerator, path_1, length_1, path_2, length_2;

initChart();

function initChart() {
    d3.csv(dataSource, function (error, data) {
        if (error) throw error;

        innerData = data.slice(10,); //Nos quedamos con los datos a partir de 1990

        //Desarrollo del gráfico > Debemos hacer muchas variables genéricas para luego actualizar el gráfico
        let margin = {top: 5, right: 22.5, bottom: 25, left: 24.5};
        let width = parseInt(chartBlock.style('width')) - margin.left - margin.right,
            height = parseInt(chartBlock.style('height')) - margin.top - margin.bottom;

        chart = chartBlock
            .append('svg')
            .lower()
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //Eje X
        x_c = d3.scaleLinear()
            .domain([1990,2019])
            .range([0, width]);

        x_cAxis = function(g){
            g.call(d3.axisBottom(x_c).ticks(5).tickFormat(function(d) { return d; }))
            g.call(function(g){
                g.selectAll('.tick line')
                    .attr('y1', '0%')
                    .attr('y2', '-' + height + '')
            })
            g.call(function(g){g.select('.domain').remove()});
        }

        chart.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr('class','x_c-axis')
            .call(x_cAxis);

        //Eje Y
        y_c = d3.scaleLinear()
            .domain([0, 90])
            .range([height,0])
            .nice();
    
        y_cAxis = function(svg){
            svg.call(d3.axisLeft(y_c).ticks(5).tickFormat(function(d) { return numberWithCommas2(d); }))
            svg.call(function(g){
                g.selectAll('.tick line')
                    .attr('class', function(d,i) {
                        if (d == 0) {
                            return 'line-special';
                        }
                    })
                    .attr("x1", '0')
                    .attr("x2", '' + width + '')
            })
            svg.call(function(g){g.select('.domain').remove()})
        }        
        
        chart.append("g")
            .attr('class','y_c-axis')
            .call(y_cAxis);

        //Línea
        line = d3.line()
            .x(d => x_c(d[0]))
            .y(d => y_c(d[1]));
        
        regressionGenerator = d3_reg.regressionLoess()
            .x(d => +d.periodo)
            .y(d => +d.tasa)
            .bandwidth(0.27);

        path_1 = chart.append("path")
            .datum(regressionGenerator(innerData))
            .attr("class", 'line-chart')
            .attr("fill", "none")
            .attr("stroke", '#296161')
            .attr("stroke-width", '2px')
            .attr("d", line);

        length_1 = path_1.node().getTotalLength();

        path_1.attr("stroke-dasharray", length_1 + " " + length_1)
            .attr("stroke-dashoffset", length_1)
            .transition()
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .duration(3000);

        chart.selectAll('circles')
            .data(innerData)
            .enter()
            .append('circle')
            .attr('class', 'circle-chart')
            .attr("r", '4')
            .attr("cx", function(d) { return x_c(+d.periodo)})
            .attr("cy", function(d) { return y_c(+d.tasa); })
            .style("fill", '#9E9E9E')
            .style('opacity', '0')
            .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
                let circles = document.getElementsByClassName('circle-chart');

                //Darle mayor presencia
                for(let i = 0; i < circles.length;i++) {
                    circles[i].style.opacity = '0.4';
                }
                this.style.opacity = '1';
                
                let data = +d.tasa;
                data = data.toFixed(1);

                //Texto
                let html = '<p class="chart__tooltip--title">' + d.periodo + '</p>' + '<p class="chart__tooltip--text">Tasa de mortalidad: ' + data.replace('.',',') + ' por cada 100.000 personas con 65 años o más</p>';
                
                tooltip.html(html);

                //Tooltip
                positionTooltip(window.event, tooltip);
                getInTooltip(tooltip);               
            })
            .on('mouseout', function(d, i, e) {
                let circles = document.getElementsByClassName('circle-chart');
                //Darle mayor presencia
                for(let i = 0; i < circles.length;i++) {
                    circles[i].style.opacity = '1';
                }
                //Quitamos el tooltip
                getOutTooltip(tooltip);                
            })
            .transition()
            .delay(function(d,i) { return i * (3000 / innerData.length - 1)})
            .style('opacity', '1');

        setTimeout(() => {
            setChartCanvas(); 
        }, 4000);
    });
}

function animateChart() {
    //Opción de tener dos líneas
    path_1 = chart.select(".line-chart")
        .datum(regressionGenerator(innerData))
        .attr("class", 'line-chart')
        .attr("fill", "none")
        .attr("stroke", '#296161')
        .attr("stroke-width", '2px')
        .attr("d", line);

    length_1 = path_1.node().getTotalLength();

    path_1.attr("stroke-dasharray", length_1 + " " + length_1)
        .attr("stroke-dashoffset", length_1)
        .transition()
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .duration(3000);

    chart
        .selectAll('.circle-chart')
        .remove();

    chart.selectAll('circles')
        .data(innerData)
        .enter()
        .append('circle')
        .attr('class', 'circle-chart')  
        .attr("r", '4')
        .attr("cx", function(d) { return x_c(+d.periodo)})
        .attr("cy", function(d) { return y_c(+d.tasa); })
        .style("fill", '#9E9E9E')
        .style('opacity', '0')
        .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
            let circles = document.getElementsByClassName('circle-chart');

            //Darle mayor presencia
            for(let i = 0; i < circles.length;i++) {
                circles[i].style.opacity = '0.4';
            }
            this.style.opacity = '1';
            
            let data = +d.tasa;
            data = data.toFixed(1);

            //Texto
            let html = '<p class="chart__tooltip--title">' + d.periodo + '</p>' + '<p class="chart__tooltip--text">Tasa de mortalidad: ' + data.replace('.',',') + ' por cada 100.000 personas con 65 años o más</p>';
            
            tooltip.html(html);

            //Tooltip
            positionTooltip(window.event, tooltip);
            getInTooltip(tooltip);               
        })
        .on('mouseout', function(d, i, e) {
            let circles = document.getElementsByClassName('circle-chart');
            //Darle mayor presencia
            for(let i = 0; i < circles.length;i++) {
                circles[i].style.opacity = '1';
            }
            //Quitamos el tooltip
            getOutTooltip(tooltip);                
        })
        .transition()
        .delay(function(d,i) { return i * (3000 / innerData.length - 1)})
        .style('opacity', '1');
}

document.getElementById('replay').addEventListener('click', function() {
    animateChart();
});

///// REDES SOCIALES /////
setRRSSLinks();

///// ALTURA DEL BLOQUE DEL GRÁFICO //////
getIframeParams();

///// DESCARGA COMO PNG O SVG > DOS PASOS/////
let pngDownload = document.getElementById('pngImage');

pngDownload.addEventListener('click', function(){
    setChartCanvasImage();
});