import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View, StyleSheet, Animated, ScrollView, Easing, Text } from 'react-native'
import ColumnChartItem from './column-chart-item'
import { initData, drawYAxis, drawYAxisLabels, drawGuideLine, numberWithCommas, drawXAxis, drawXAxisLabels } from '../common'
import RNLinearGradient from 'react-native-linear-gradient';

export default class ColumnChart extends Component {
  constructor(props) {
    super(props)
    let defaultGap = this.props.defaultColumnWidth + this.props.defaultColumnMargin
    let newState = initData(this.props.data, this.props.height, defaultGap, this.props.numberOfYAxisGuideLine)
    this.state = {
      sortedData: newState.sortedData,
      max: newState.max,
      selectedIndex: null,
      fadeAnim: new Animated.Value(0),
      guideArray: newState.guideArray,
      gap: defaultGap
    }

    this.scrollView = null

    this.renderColumns = this.renderColumns.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.drawTooltip = this.drawTooltip.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState(Object.assign({
        fadeAnim: new Animated.Value(0)
      }, initData(nextProps.data, this.props.height, this.state.gap, this.props.numberOfYAxisGuideLine)), () => {
        Animated.timing(this.state.fadeAnim, { toValue: 1, easing: Easing.bounce, duration: 1000, useNativeDriver: true }).start()
      })
    }
  }

  componentDidUpdate(nextProps, nextState) {
    if (this.scrollView != null && nextState.max == 0) {
      setTimeout(
        () => this.scrollView.scrollTo(this.props.initialScrollPosition), this.props.initialScrollTimeOut
      )
    }
  }

  componentDidMount() {
    Animated.timing(this.state.fadeAnim, {
      toValue: 1, easing: Easing.bounce, duration: 1000, useNativeDriver: true
    }).start()
    if (this.scrollView != null) {
      setTimeout(
        () => this.scrollView.scrollTo(this.props.initialScrollPosition), this.props.initialScrollTimeOut
      )
    }

  }

  renderColumns(fadeAnim) {
    let seriesArray = this.state.sortedData
    let seriesCount = seriesArray.length
    let renderColumns = []
    if (seriesCount > 0) {
      let standardSeries = seriesArray[0]
      let dataCount = standardSeries.data.length
      for (let i = 0; i < dataCount; i++) {
        renderColumns.push(
          <ColumnChartItem key={i} seriesArray={this.state.sortedData}
            dataIndex={i}
            defaultWidth={this.props.defaultColumnWidth}
            defaultHeight={this.props.height + 20}
            defaultMargin={this.props.defaultColumnMargin}
            defaultBorderColor={this.props.defaultBorderColor}
            isSelected={this.state.selectedIndex === i}
            highlightColor={this.props.highlightColor}
            onClick={(evt) => this.handleClick(evt, i)}
            primaryColor={this.props.primaryColor} />
        )
      }
    }
    return (
      <Animated.View style={[
        styles.chartView, {
          transform: [{ scaleY: fadeAnim }],
          marginBottom: this.props.minValue && this.state.guideArray && this.state.guideArray.length > 0 ? -1 * this.state.guideArray[0][2] * this.props.minValue : null
        }]}>
        {renderColumns}
      </Animated.View>
    )
  }

  handleClick(event, index) {
    this.setState({
      selectedIndex: index
    }, () => {
      if (typeof this.props.onPress === 'function') {
        this.props.onPress(index)
      }
    })
  }
  drawTooltip(selectedIndex) {
    if (typeof (selectedIndex) === 'number' && selectedIndex >= 0) {
      let standardSeries = this.state.sortedData[0]
      if (!standardSeries) {
        console.warn('standardSeries is null')
        return null
      }

      let seriesCount = this.state.sortedData.length
      let plusGap = 10 * seriesCount
      if (this.state.sortedData.length === 1) {
        plusGap = 0
      } else if (selectedIndex === standardSeries.data.length - 1) {
        plusGap = -50
      }
      // 차트 width를 마지막에 늘려야겠음.

      let left = standardSeries.data[selectedIndex]['gap'] + plusGap
      let tooltipRenders = []
      for (let i = 0; i < this.state.sortedData.length; i++) {
        let series = this.state.sortedData[i]
        if (series.data[selectedIndex]['x']) {
          tooltipRenders.push(<Text key={'tooltipTitle-' + i} style={styles.tooltipTitle}>{series.data[selectedIndex]['x']}</Text>)
        }
        tooltipRenders.push(
          <View key={'tooltipText-' + i} style={{ flexDirection: 'row', paddingLeft: 5, alignItems: 'center' }}>
            <View style={[styles.tooltipColor, { backgroundColor: !series.seriesColor ? this.props.primaryColor : series.seriesColor }]} />
            <Text style={styles.tooltipValue}>{numberWithCommas(series.data[selectedIndex]['y'], false)}</Text>
          </View>
        )
      }
      return (
        <View style={[styles.tooltipWrapper, { left: left }]}>
          <View style={styles.tooltip}>
            {tooltipRenders}
          </View>
        </View>
      )
    } else {
      return null
    }
  }

  render() {
    console.log("guideArray===>", this.state.guideArray);

    let { fadeAnim } = this.state
    if (this.state.sortedData && this.state.sortedData.length === 0) return null

    return (
      <View style={StyleSheet.flatten([styles.wrapper, {
        backgroundColor: this.props.backgroundColor,
        height:this.props.height + 100
      }])}>
        <View style={styles.yAxisLabelsWrapper}>
          {this.props.showYAxisLabel &&
            drawYAxisLabels(this.state.guideArray, this.props.height +20+50, this.props.minValue, this.props.yAxisLabelTextStyle, this.props.yAxisSymbol, this.props.leftViewWidth)}
          {this.props.showShadow &&
            <RNLinearGradient
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 1 }}
              colors={['#EAEAEA', 'white']}
              style={{
                width: 15,
                position: 'absolute', top: 0, left: this.props.leftViewWidth + 15, right: 0, bottom: 0, height: this.props.height + 20 + 50
              }}
            />}
        </View>
        <View style={styles.mainContainer}>
          <View style={{ backgroundColor: "transparent", height: '100%', width: '100%', position: 'absolute', bottom: 50, left: 0 }}>
            {drawGuideLine(this.state.guideArray, this.props.yAxisGridLineColor)}
            {drawXAxis(this.props.xAxisColor)}
          </View>
          <ScrollView
            style={{ flex: 1, backgroundColor: "transparent",paddingLeft: 20  }}
            ref={scrollView => this.scrollView = scrollView} 
            horizontal>
            <View style={{ flex: 1, flexDirection: "column-reverse" }}>
              {this.props.showXAxisLabel &&
                drawXAxisLabels(this.state.sortedData[0].data, this.state.gap, this.props.xAxisLabelTextStyle, this.props.showEvenNumberXaxisLabel)}

              <View ref='chartView' style={styles.chartContainer}>
              {this.props.showYAxis && drawYAxis(this.props.yAxisColor)}

                {this.renderColumns(fadeAnim)}
              </View>
            </View>
            {this.drawTooltip(this.state.selectedIndex)}
          </ScrollView>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  yAxisLabelsWrapper: {
    paddingRight: 5,
    flexDirection:'row',
    paddingBottom:5
  },
  mainContainer: {
    flex: 1,
    marginLeft: 30
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    margin: 0,
    paddingRight: 0,
    overflow: 'hidden'
  },
  chartView: {
    marginLeft:10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%'
  },
  tooltipWrapper: {
    position: 'absolute',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderColor: '#AAAAAA',
    borderWidth: 1,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8
  },
  tooltipTitle: { fontSize: 10 },
  tooltipValue: { fontWeight: 'bold', fontSize: 15 },
  tooltipColor: {
    width: 10,
    height: 5,
    marginRight: 3,
    borderRadius: 2
  }
})

ColumnChart.propTypes = {
  data: PropTypes.array
}
ColumnChart.defaultProps = {
  data: [],
  height: 100,
  defaultColumnWidth: 40,
  defaultColumnMargin: 20,
  defaultBorderColor: '#FFFFFF',
  primaryColor: '#297AB1',
  highlightColor: 'red',
  showEvenNumberXaxisLabel: true,
  initialScrollPosition: { x: 0, y: 0, animated: true },
  initialScrollTimeOut: 300,
  showYAxisLabel: true,
  showXAxisLabel: true,
  yAxisSymbol: ''
}
