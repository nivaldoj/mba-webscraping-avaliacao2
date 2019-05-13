import React, { Component } from 'react';
import * as topojson from "topojson-client";
import * as d3 from 'd3';

class GeoMap extends Component {

    state = {
        geoData: {},
    }

    drawed = false;

    getData() {
        // não foram carregados os dados?
        if (!("objects" in this.state.geoData)) {
            // leitura dos dados de equipamentos de saúde (vindos do JSON)
            d3.json("/equipamentos_saude_upa_pac2_funcionamento_export_topojson.json")
                .then((data) => {
                    // cria uma estrutura map (dicionário) {id, nome} de cada estado
                    this.states = new Map(data.objects.states.geometries.map(d => [d.id, d.properties]));

                    // mantém os dados obtidos
                    this.setState({geoData: data});
                })
                .catch(err => console.log("Error loading/parsing data: " + err));
        }
    }

    drawChart(state) {     
        let geoData = state.geoData;

        // não execute enquanto não carregar os dados
        if (!("objects" in geoData))
            return;
        // não execute novamente se o mapa já foi renderizado
        if (this.drawed === true)
            return;

        this.drawed = true;

        // seleciona o elemento de mapa geográfico
        this.svg = d3.select("svg.geomap").style("width", "100%");

        // usando as dimensões do mapa, faz o cálculo de translação
        // é necessário para exibir o mapa centralizado, na posição correta 
        let mWidth = this.svg.attr("width");
        let mHeight = this.svg.attr("height");
        let newPosition = [mWidth / 2 + 900, mHeight / 2 - 200];

        // inicializa a projeção do mapa 
        this.projection = d3.geoMercator().scale(750).translate(newPosition);
        this.path = d3.geoPath().projection(this.projection);
        
        // inicializa/configura a renderização dos estados brasileiros no mapa
        const gstates = this.svg.append("g").attr("id", "gstates");
        gstates.selectAll("path")
            .data(topojson.feature(geoData, geoData.objects.states).features)
            .join("path")
                .attr("fill", "#c9cc2c")
                .attr("stroke", "#3e7c00")
                .attr("id", d => `estado_${d.id}`)
                .attr("stroke-width", 0.6)
                .attr("stroke-linejoin", "round")
                .attr("d", this.path)
                .append("title")
                    .text(d => d.properties.name);

        // inicializa/configura os pontos (dados) de equipamentos no mapa
        const gequips = this.svg.append("g").attr("id", "gequips");
        gequips.selectAll("path")
            .data(topojson.feature(geoData, geoData.objects.equipamentos_saude_upa_pac2_funcionamento).features)
            .join("path")
                .attr("fill", "#008c0b")
                .attr("stroke", "#004701")
                .attr("stroke-width", 0.3)
                .attr("fill-opacity", 0.3)
                .attr("d", this.path)
                .append("title")
                    .text(d => d.properties[0].no_cidade)
        
        // configura o zoom do mapa
        this.zoom = d3.zoom().on("zoom", () => {
            gstates.attr("transform", d3.event.transform);
            gequips.attr("transform", d3.event.transform);
        });
        this.svg.call(this.zoom);
    }

    componentDidMount() {
        this.getData();
    }

    render() {
        return (
            <div>
                <svg className="geomap" width="800" height="560"></svg>
                { this.drawChart(this.state) }
            </div>
        );
    }

}

export default GeoMap;