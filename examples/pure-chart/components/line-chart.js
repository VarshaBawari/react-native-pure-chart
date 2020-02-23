import React from 'react'
import { View, TouchableWithoutFeedback, Text, Animated, Easing, ScrollView, StyleSheet } from 'react-native'
import {initData, drawYAxis, drawGuideLine, drawYAxisLabels, numberWithCommas, drawXAxis, drawXAxisLabels} from '../common'
import RNLinearGradient from 'react-native-linear-gradient';

class LineChart extends React.Component {
  constructor (props) {
    super(props)
    let newState = initData(
      this.props.data, 
      this.props.height, 
      this.props.gap, 
      this.props.numberOfYAxisGuideLine)
    this.state = {
      loading: false,
      sortedData: newState.sortedData,
      selectedIndex: null,
      nowHeight: 200,
      nowWidth: 200,
      scrollPosition: 0,
      nowX: 0,
      nowY: 0,
      max: newState.max,
      lineThickness: (this.props.lineThickness > 10)? 10 : this.props.lineThickness,
      fadeAnim: new Animated.Value(0),
      guideArray: newState.guideArray
    }
    this.scrollView = null

    this.drawCoordinates = this.drawCoordinates.bind(this)
    this.drawCoordinate = this.drawCoordinate.bind(this)
    this.drawSelected = this.drawSelected.bind(this)
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (nextState.sortedData !== this.state.sortedData ||
      nextState.selectedIndex !== this.state.selectedIndex ||
      nextState.scrollPosition !== this.state.scrollPosition) {
      return true
    } else {
      return false
    }
  }

  componentDidUpdate(nextProps, nextState){
    if(this.scrollView != null && nextState.max == 0){
      setTimeout(
        () => this.scrollView.scrollTo(this.props.initialScrollPosition), this.props.initialScrollTimeOut
      )
    }
  }

  componentDidMount () {
    Animated.timing(this.state.fadeAnim, { toValue: 1, easing: Easing.bounce, duration: 1000, useNativeDriver: true }).start()
    if(this.scrollView != null){
      setTimeout(
        () => this.scrollView.scrollTo(this.props.initialScrollPosition), this.props.initialScrollTimeOut
      )
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState(Object.assign({
        fadeAnim: new Animated.Value(0)
      }, initData(nextProps.data, this.props.height, this.props.gap, this.props.numberOfYAxisGuideLine)), () => {
        Animated.timing(this.state.fadeAnim, { toValue: 1, easing: Easing.bounce, duration: 1000, useNativeDriver: true }).start()
      })
    }
  }

  getTransform (rad, width, direction) {
    let x = (0 - width / 2) * Math.cos(rad) - (0 - width / 2) * Math.sin(rad)
    let y = (0 - width / 2) * Math.sin(rad) + (0 - width / 2) * Math.cos(rad)
    let translateX = (-1 * x) - width / 2
    if(direction === 'lower') translateX = translateX + this.state.lineThickness
    return [ {translateX: translateX}, {translateY: (-1 * y) + width / 2}, { rotate: rad + 'rad' } ]
  }

  drawCoordinate (index, start, end, backgroundColor, lineStyle, isBlank, lastCoordinate, seriesIndex) {
    let key = 'line' + index
    let dx = end.gap - start.gap
    let dy = end.ratioY - start.ratioY
    let size = Math.sqrt(dx * dx + dy * dy)
    let angleRad = -1 * Math.atan2(dy, dx)
    let height
    let top
    let topMargin = 20
    let direction

    if (start.ratioY > end.ratioY) {
      direction = 'lower'
      height = start.ratioY
      top = -1 * size - (this.state.lineThickness-2)
    } else {
      direction = 'upper'
      height = end.ratioY
      top = -1 * (size - Math.abs(dy)) - (this.state.lineThickness-1.3)
    }

    return (
      <View key={key} style={{
        height: this.props.height + topMargin,
        justifyContent: 'flex-end'
      }}>

        <View style={StyleSheet.flatten([{
          width: dx,
          height: height,
          marginTop: topMargin,
          }, styles.coordinateWrapper])}>
          <View style={StyleSheet.flatten([{
            top: top,
            width: size,
            height: size,
            borderColor: isBlank ? backgroundColor : this.props.primaryColor,
            borderTopWidth: this.state.lineThickness,
            transform: this.getTransform(angleRad, size, direction)
            }, styles.lineBox, lineStyle])} />
          <View style={StyleSheet.flatten([styles.absolute, {
            height: height - Math.abs(dy) - 2,
            backgroundColor: lastCoordinate ? '#FFFFFF00' : backgroundColor,
            marginTop: Math.abs(dy) + 2
            }])} />
        </View>

        {!lastCoordinate && seriesIndex === 0 ? (
          null
          // <View style={StyleSheet.flatten([styles.guideLine, {
          //   width: dx,
          //   borderRightColor: this.props.xAxisGridLineColor
          // }])} />
        ) : null}
        {seriesIndex === this.state.sortedData.length - 1 && (
          <TouchableWithoutFeedback onPress={() => {
            let selectedIndex = lastCoordinate ? index - 1 : index

            let emptyCount = 0
            this.state.sortedData.map((series) => {
              if (series.data[selectedIndex].isEmpty) emptyCount++
            })
            if (emptyCount === this.state.sortedData.length) {
              return null
            }
            this.setState({
              selectedIndex: selectedIndex
            }, () => {
              if (typeof this.props.onPress === 'function') {
                this.props.onPress(selectedIndex)
              }
            })
          }}>
            <View style={{
              width: dx,
              height: '100%',
              position: 'absolute',
              marginLeft: -1 * dx / 2,
              backgroundColor: '#FFFFFF01'
            }} />
          </TouchableWithoutFeedback>
        )}

      </View>
    )
  }

  drawPoint (index, point, seriesColor) {
    let key = 'point' + index
    let size = this.props.pointSize
    let color = !seriesColor ? this.props.primaryColor : seriesColor
    if (this.state.selectedIndex === index) {
      color = this.props.selectedColor
    }

    if (point.isEmpty || this.props.hidePoints) return null

    return (
      <TouchableWithoutFeedback key={key} onPress={() => {
        this.setState({selectedIndex: index})
      }}>

        <View style={StyleSheet.flatten([styles.pointWrapper, {
          width: size + this.state.lineThickness - 2,
          height: size + this.state.lineThickness - 2,

          left: point.gap - size / 2,
          bottom: point.ratioY - size / 2,

          borderColor: color,
          backgroundColor: color

        }])} />
      </TouchableWithoutFeedback>
    )
  }
  drawValue (index, point) {
    let key = 'pointvalue' + index
    let size = 200
    return (

      <View key={key} style={{
        position: 'absolute',
        left: index === 0 ? point.gap : point.gap - size / 2,
        bottom: point.ratioY + 10,
        backgroundColor: 'transparent',
        width: index !== 0 ? 200 : undefined

      }} >
        {this.drawCustomValue(index, point)}

      </View>

    )
  }

  drawCustomValue (index, point) {
    if (this.props.customValueRenderer) {
      return this.props.customValueRenderer(index, point)
    } else {
      return null
    }
  }

  drawCoordinates (data, seriesColor, seriesIndex) {
    let result = []
    let lineStyle = {
      borderColor: !seriesColor ? this.props.primaryColor : seriesColor
    }
    let dataLength = data.length

    for (let i = 0; i < dataLength - 1; i++) {
      result.push(this.drawCoordinate(i, data[i], data[i + 1], '#FFFFFF00', lineStyle, false, false, seriesIndex))
    }

    if (dataLength > 0) {
      result.push(this.drawPoint(0, data[0], seriesColor))
      result.push(this.drawValue(0, data[0], seriesColor))
    }

    for (let i = 0; i < dataLength - 1; i++) {
      result.push(this.drawPoint((i + 1), data[i + 1], seriesColor))
      result.push(this.drawValue((i + 1), data[i + 1], seriesColor))
    }

    let lastData = Object.assign({}, data[dataLength - 1])
    let lastCoordinate = Object.assign({}, data[dataLength - 1])
    lastCoordinate.gap = lastCoordinate.gap + this.props.gap
    result.push(this.drawCoordinate((dataLength), lastData, lastCoordinate, '#FFFFFF00', {}, true, true, seriesIndex))

    return result
  }

  getDistance (p1, p2) {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2))
  }

  drawSelected (index) {
    if (this.state.sortedData.length === 0) return null
    let data = this.state.sortedData[0].data
    let dataObject = data[index]
    if (typeof (this.state.selectedIndex) === 'number' && this.state.selectedIndex >= 0) {
      if (!dataObject) {
        return null
      }
      let reverse = true
      let bottom = dataObject.ratioY

      let left = dataObject.gap
      let gap = 0
      if (index === data.length - 1 && index !== 0) {
        left = data[index - 1].gap
        gap = dataObject.gap - left
      }
      if (bottom > this.props.height * 2 / 3) {
        reverse = false
      }

      return (
        <View style={StyleSheet.flatten([styles.selectedWrapper, {
          left: left,
          justifyContent: 'center'
        }])}>
          <View style={StyleSheet.flatten([styles.selectedLine, {
            backgroundColor: "rgba(0,0,0,0.05)",
            marginLeft: gap
          }])} />

          <View style={StyleSheet.flatten([styles.selectedBox])}>
            {this.state.sortedData.map((series) => {
              let dataObject = series.data[this.state.selectedIndex]
              return (
                <View key={series.seriesName}>
                  {dataObject.x ? (
                    <Text style={styles.tooltipTitle}>{dataObject.x}</Text>
                ) : null}
                  <View style={{ flexDirection: 'row', paddingTop: 10, alignItems: 'center' }}>
                    <View style={{
                      width: 10,
                      height: 10,
                      marginRight: 3,
                      borderRadius: 2,
                      backgroundColor: !series.seriesColor ? this.props.primaryColor : series.seriesColor
                    }} />
                    <Text style={styles.tooltipValue}>{numberWithCommas(dataObject.y, false)}</Text>
                  </View>
                </View>
              )
            })}

          </View>

        </View>
      )
    } else {
      return null
    }
  }

  render () {
    let {fadeAnim} = this.state
    return (
      this.state.sortedData.length > 0 ? (
        <View style={StyleSheet.flatten([styles.wrapper, {
          backgroundColor: this.props.backgroundColor,
          flexDirection:'row-reverse'
        }])}>
          <View style={{flex:1,marginLeft:30}}>
          <View style={{backgroundColor:"transparent",height:'100%',width:'100%',position:'absolute',bottom:50,left:0}}>
            {drawGuideLine(this.state.guideArray, this.props.yAxisGridLineColor)}
            {drawXAxis(this.props.xAxisColor)}
          </View>
            <ScrollView
            style={{flex:1,backgroundColor:"transparent",paddingLeft: 20 }}
              horizontal
              ref={ref => this.scrollView = ref}
              onContentSizeChange={() => {
                if(this.props.lineChartScrollToEnd) this.scrollView.scrollToEnd({ animated: false });
              }}>

              <View style={{flex:1,flexDirection:"column-reverse" }}>
              {this.props.showXAxisLabel && 
                  drawXAxisLabels(this.state.sortedData[0].data, this.props.gap, this.props.xAxisLabelTextStyle, this.props.showEvenNumberXaxisLabel)}
                <View ref='chartView' style={styles.chartViewWrapper}>

                  {this.props.showYAxis && drawYAxis(this.props.yAxisColor)}
                  
                  {this.state.sortedData.map((obj, index) => {                    
                    return (
                      <Animated.View key={'animated_' + index} style={{
                        marginLeft:10,
                        transform: [{scaleY: fadeAnim}],
                        flexDirection: 'row',
                        alignItems: 'flex-end',
                        height: '100%',
                        position: index === 0 ? 'relative' : 'absolute',
                        minWidth: 200,
                        marginBottom: this.props.minValue && this.state.guideArray && this.state.guideArray.length > 0 ? -1 * this.state.guideArray[0][2] * this.props.minValue : null
                      }} >
                        {this.drawCoordinates(obj.data, obj.seriesColor, index)}
                      </Animated.View>
                    )
                  })}
                  {this.drawSelected(this.state.selectedIndex)}

                </View>

                  </View>

            </ScrollView>
            
          </View>
          <View style={styles.yAxisLabelsWrapper}>
            { this.props.showYAxisLabel && 
              drawYAxisLabels(this.state.guideArray, this.props.height + 20, this.props.minValue, this.props.yAxisLabelTextStyle, this.props.yAxisSymbol, this.props.leftViewWidth)}
           { this.props.showShadow && 
             <RNLinearGradient
             start={ { x: 0, y: 1 } }
             end={ { x: 1, y: 1 } }
             colors={ ['#EAEAEA', 'white'] }
             style={ {width: 15,
             position: 'absolute', top:0,left:this.props.leftViewWidth+15,right:0,bottom:0,height: this.props.height + 20 +50} }
           />}
          </View>

        </View>
      ) : null

    )
  }
}

LineChart.defaultProps = {
  pointSize:10,
  data: [],
  primaryColor: '#297AB1',
  selectedColor: '#FF0000',
  height: 100,
  gap: 60,
  yAxisSymbol: '',
  showEvenNumberXaxisLabel: true,
  initialScrollPosition: {x: 0, y: 0, animated: true},
  initialScrollTimeOut: 300,
  showYAxisLabel: true,
  showXAxisLabel: true,
  lineThickness: 1,
  onPointClick: (point) => {

  },
  numberOfYAxisGuideLine: 5
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    overflow: 'hidden'
  },
  yAxisLabelsWrapper: {
    paddingRight: 5,
    flexDirection:'row',
    paddingBottom:50
  },
  chartViewWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    margin: 0,
    paddingRight: 0,
    overflow: 'hidden'
  },
  coordinateWrapper: {
    overflow: 'visible',
    justifyContent: 'flex-start',
    alignContent: 'flex-start'
  },
  lineBox: {
    overflow: 'hidden',
    justifyContent: 'flex-start'
  },
  guideLine: {
    position: 'absolute',
    height: '100%',
    borderRightColor: '#e0e0e050',
    borderRightWidth: 1
  },
  absolute: {
    position: 'absolute',
    width: '100%'
  },
  pointWrapper: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1
  },
  selectedWrapper: {
    position: 'absolute',
    height: '100%',
    alignItems: 'flex-start'
  },
  selectedLine: {
    position: 'absolute',
    width: 1,
    height: '100%'
  },
  selectedBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    opacity: 0.8,
    borderColor: 'transparent',
    borderWidth: 1,
    position: 'absolute',
    padding: 3,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems:'center',
    width:100,
    shadowColor: '#00000077',
    shadowOpacity: 10,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  tooltipTitle: { fontSize: 16, textAlign:'center' ,paddingTop: 10},
  tooltipValue: {fontWeight: 'bold', fontSize: 15}
})

export default LineChart
