import React, { Component } from 'react';
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  TouchableWithoutFeedback,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableHighlight,
  Modal,
  ActivityIndicator,
  FlatList,
  Platform
} from 'react-native';
import PropTypes from 'prop-types';
import * as animatable from 'react-native-animatable';

const TOUCHABLE_ELEMENTS = [
  'TouchableHighlight',
  'TouchableOpacity',
  'TouchableWithoutFeedback',
  'TouchableNativeFeedback',
];

export default class ModalDropdown extends Component {
  static propTypes = {
    // Adding backdrops
    hasBackdrop: PropTypes.bool,
    backdropColor: PropTypes.string,
    backdropOpacity: PropTypes.number,
    backdropTransitionInTiming: PropTypes.number,
    backdropTransitionOutTiming: PropTypes.number,
    useNativeDriver: PropTypes.bool,
    useNativeDriverForBackdrop: PropTypes.bool,
    onBackdropPress: PropTypes.func,
  
    disabled: PropTypes.bool,
    multipleSelect: PropTypes.bool,
    scrollEnabled: PropTypes.bool,
    defaultIndex: PropTypes.number,
    defaultValue: PropTypes.string,
    options: PropTypes.array.isRequired,
    accessible: PropTypes.bool,
    animated: PropTypes.bool,
    isFullWidth: PropTypes.bool,
    showsVerticalScrollIndicator: PropTypes.bool,
    keyboardShouldPersistTaps: PropTypes.string,
    style: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.object,
      PropTypes.array,
    ]),
    textStyle: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.object,
      PropTypes.array,
    ]),
    defaultTextStyle: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.object,
      PropTypes.array,
    ]),
    dropdownStyle: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.object,
      PropTypes.array,
    ]),
    dropdownTextStyle: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.object,
      PropTypes.array,
    ]),
    dropdownTextHighlightStyle: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.object,
      PropTypes.array,
    ]),
    dropdownListProps: PropTypes.object,
    dropdownTextProps: PropTypes.object,
    adjustFrame: PropTypes.func,
    renderRow: PropTypes.func,
    renderRowComponent: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.object,
    ]),
    renderRowProps: PropTypes.object,
    renderSeparator: PropTypes.func,
    renderButtonText: PropTypes.func,
    renderRowText: PropTypes.func,
    renderButtonComponent: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.object,
    ]),
    renderRightComponent: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.object,
    ]),
    renderButtonProps: PropTypes.object,
    onDropdownWillShow: PropTypes.func,
    onDropdownWillHide: PropTypes.func,
    onSelect: PropTypes.func,
  };

  static defaultProps = {
    //backdrop
    hasBackdrop: true,
    backdropColor: 'black',
    backdropOpacity: 0.7,
    backdropTransitionInTiming: 300,
    backdropTransitionOutTiming: 300,
    useNativeDriver: false,
    onBackdropPress: () => null,

    disabled: false,
    multipleSelect: false,
    scrollEnabled: true,
    defaultIndex: -1,
    defaultValue: 'Please select...',
    animated: true,
    isFullWidth: false,
    showsVerticalScrollIndicator: true,
    keyboardShouldPersistTaps: 'never',
    renderRowComponent: Platform.OS === 'ios' ? TouchableOpacity : TouchableHighlight,
    renderButtonComponent: TouchableOpacity,
    renderRightComponent: View
  };

  constructor(props) {
    super(props);
    this._button = null;
    this._buttonFrame = null;

    this.state = {
      // backdrop
      showContent: false,

      accessible: !!props.accessible,
      loading: !props.options,
      showDropdown: false,
      buttonText: props.defaultValue,
      selectedIndex: props.defaultIndex,
    };
  }

  static getDerivedStateFromProps(nextProps, state) {
    let {selectedIndex, loading} = state;
    const {defaultIndex, defaultValue, options} = nextProps;
    let newState = null;

    if (selectedIndex < 0) {
      selectedIndex = defaultIndex;
      newState = {
        selectedIndex: selectedIndex
      };
      if (selectedIndex < 0) {
        newState.buttonText = defaultValue;
      }
    }

    if (!loading !== !options) {
      if (!newState) {
        newState = {};
      }
      newState.loading = !options;
    }
    return newState;
  }

  render() {
    return (
      <View {...this.props}>
        {this._renderButton()}
        {this._renderModal()}
      </View>
    );
  }

  // backdrop
  makeBackdrop = () => {
    // use Loading to replace showContent
    let {loading} = this.state;

    if (!this.props.hasBackdrop) {
      return null;
    }

    const {
      // customBackdrop,
      backdropColor,
      useNativeDriver,
      useNativeDriverForBackdrop,
      onBackdropPress,
    } = this.props;
    // const hasCustomBackdrop = !!this.props.customBackdrop;

    const backdropComputedStyle = [
      {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor:
          loading? backdropColor : 'transparent',
      },
    ];

    const backdropWrapper = (
      <animatable.View
        ref={ref => (this.backdropRef = ref)}
        useNativeDriver={
          useNativeDriverForBackdrop !== undefined
            ? useNativeDriverForBackdrop
            : useNativeDriver
        }
        style={[styles.backdrop, backdropComputedStyle]}>
        {/* {hasCustomBackdrop && customBackdrop} */}
      </animatable.View>
    );

    return (
      <TouchableWithoutFeedback onPress={onBackdropPress}>
        {backdropWrapper}
      </TouchableWithoutFeedback>
    );
  }

  _updatePosition(callback) {
    if (this._button && this._button.measure) {
      this._button.measure((fx, fy, width, height, px, py) => {
        this._buttonFrame = {
          x: px,
          y: py,
          w: width,
          h: height,
        };
        callback && callback();
      });
    }
  }

  show() {
    this._updatePosition(() => {
      this.setState({
        showDropdown: true,
      });
    });
  }

  hide() {
    this.setState({
      showDropdown: false,
    });
  }

  select(idx) {
    const {
      defaultValue,
      options,
      defaultIndex,
      renderButtonText,
    } = this.props;
    let value = defaultValue;

    if (idx == null || !options || idx >= options.length) {
      idx = defaultIndex;
    }
    if (idx >= 0) {
      value = renderButtonText
        ? renderButtonText(options[idx])
        : options[idx].toString();
    }

    this.setState({
      buttonText: value,
      selectedIndex: idx,
    });
  }

  _renderButton() {
    const {
      disabled,
      accessible,
      children,
      textStyle,
      defaultTextStyle,
      renderButtonComponent,
      renderButtonProps,
      renderRightComponent
    } = this.props;
    const ButtonTouchable = renderButtonComponent;
    const RightComponent = renderRightComponent;
    const { buttonText, selectedIndex } = this.state;
    const buttonTextStyle = selectedIndex < 0 ? [textStyle, defaultTextStyle] : textStyle;
    return (
      <ButtonTouchable
        ref={button => (this._button = button)}
        disabled={disabled}
        accessible={accessible}
        onPress={this._onButtonPress}
        {...renderButtonProps}
      >
        {children || (
          <View style={styles.button}>
            <Text style={[styles.buttonText, buttonTextStyle]} numberOfLines={1}>
              {buttonText}
            </Text>
            <RightComponent />
          </View>
        )}
      </ButtonTouchable>
    );
  }

  _onButtonPress = () => {
    const { onDropdownWillShow } = this.props;

    if (!onDropdownWillShow || onDropdownWillShow() !== false) {
      this.show();
    }
  };

  _renderModal() {
    const { animated, accessible, dropdownStyle } = this.props;
    const { showDropdown, loading } = this.state;

    if (showDropdown && this._buttonFrame) {
      const frameStyle = this._calcPosition();
      const animationType = animated ? 'fade' : 'none';

      return (
        <Modal
          animationType={animationType}
          visible
          transparent
          onRequestClose={this._onRequestClose}
          supportedOrientations={[
            'portrait',
            'portrait-upside-down',
            'landscape',
            'landscape-left',
            'landscape-right',
          ]}
        >
          <TouchableWithoutFeedback
            accessible={accessible}
            disabled={!showDropdown}
            onPress={this._onModalPress}
          >
            <View style={styles.modal}>
              <View style={[styles.dropdown, dropdownStyle, frameStyle]}>
                {loading ? this._renderLoading() : this._renderDropdown()}
                {this.makeBackdrop()}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
    }
  }

  _calcPosition() {
    const { dropdownStyle, style, adjustFrame, isFullWidth } = this.props;
    const dimensions = Dimensions.get('window');
    const windowWidth = dimensions.width;
    const windowHeight = dimensions.height;
    const dropdownHeight =
      (dropdownStyle && StyleSheet.flatten(dropdownStyle).height) ||
      StyleSheet.flatten(styles.dropdown).height;
    const bottomSpace =
      windowHeight - this._buttonFrame.y - this._buttonFrame.h;
    const rightSpace = windowWidth - this._buttonFrame.x;
    const showInBottom =
      bottomSpace >= dropdownHeight || bottomSpace >= this._buttonFrame.y;
    const showInLeft = rightSpace >= this._buttonFrame.x;
    const positionStyle = {
      height: dropdownHeight,
      top: showInBottom
        ? this._buttonFrame.y + this._buttonFrame.h
        : Math.max(0, this._buttonFrame.y - dropdownHeight),
    };

    if (showInLeft) {
      positionStyle.left = this._buttonFrame.x;
      if(isFullWidth) {
        positionStyle.right = rightSpace - this._buttonFrame.w;
      }
    } else {
      const dropdownWidth =
        (dropdownStyle && StyleSheet.flatten(dropdownStyle).width) ||
        (style && StyleSheet.flatten(style).width) || -1;

      if (dropdownWidth !== -1) {
        positionStyle.width = dropdownWidth;
      }

      positionStyle.right = rightSpace - this._buttonFrame.w;
    }

    return adjustFrame ? adjustFrame(positionStyle) : positionStyle;
  }

  _onRequestClose = () => {
    const { onDropdownWillHide } = this.props;
    if (!onDropdownWillHide || onDropdownWillHide() !== false) {
      this.hide();
    }
  };

  _onModalPress = () => {
    const { onDropdownWillHide } = this.props;
    if (!onDropdownWillHide || onDropdownWillHide() !== false) {
      this.hide();
    }
  };

  _renderLoading = () => {
    return <ActivityIndicator size="small" />;
  };

  _renderDropdown() {
    const {
      scrollEnabled,
      renderSeparator,
      showsVerticalScrollIndicator,
      keyboardShouldPersistTaps,
      options,
      dropdownListProps,
    } = this.props;

    return (
      <FlatList
        {...dropdownListProps}
        data={options}
        scrollEnabled={scrollEnabled}
        style={styles.list}
        keyExtractor={(item, i) => (`key-${i}`)}
        renderItem={this._renderItem}
        ItemSeparatorComponent={renderSeparator || this._renderSeparator}
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      />
    );
  }

  _renderItem = ({ item, index, separators }) => {
    const {
      renderRow,
      renderRowComponent,
      renderRowProps,
      dropdownTextStyle,
      dropdownTextHighlightStyle,
      accessible,
      dropdownTextProps,
      renderRowText
    } = this.props;
    const RowTouchable = renderRowComponent;
    const { selectedIndex } = this.state;
    const key = `row_${index}`;
    const highlighted = index === selectedIndex;
    const value =
        (renderRowText && renderRowText(item)) || item.toString();
    const row = !renderRow ? (
      <Text
        style={[
          styles.rowText,
          dropdownTextStyle,
          highlighted && styles.highlightedRowText,
          highlighted && dropdownTextHighlightStyle,
        ]}
        {...dropdownTextProps}
      >
        {value}
      </Text>
    ) : (
      renderRow(item, index, highlighted)
    );

    const touchableProps = {
      key,
      accessible,
      onPress: () => this._onRowPress(item, index, separators),
      ...renderRowProps
    };

    return <RowTouchable {...touchableProps}>{row}</RowTouchable>;
  };

  _onRowPress(rowData, rowID, highlightRow) {
    const {
      onSelect,
      renderButtonText,
      onDropdownWillHide,
      multipleSelect
    } = this.props;

    if (!onSelect || onSelect(rowID, rowData) !== false) {
      const value =
        (renderButtonText && renderButtonText(rowData)) || rowData.toString();

      this.setState({
        buttonText: value,
        selectedIndex: rowID,
      });
    }

    if (!multipleSelect &&
        (!onDropdownWillHide || onDropdownWillHide() !== false)
       ) {
      this.setState({
        showDropdown: false,
      });
    }
  }

  _renderSeparator = ({ leadingItem = '' }) => {
    const key = `spr_${leadingItem}`;

    return <View style={styles.separator} key={key} />;
  };
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0,
    backgroundColor: 'black',
  },
  button: {
    // justifyContent: 'center',
    flexDirection:'row',
    alignItems: 'center'
  },
  buttonText: {
    fontSize: 12,
  },
  modal: {
    flexGrow: 1,
  },
  dropdown: {
    position: 'absolute',
    height: (33 + StyleSheet.hairlineWidth) * 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'lightgray',
    borderRadius: 2,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  loading: {
    alignSelf: 'center',
  },
  list: {
    // flexGrow: 1,
  },
  rowText: {
    paddingHorizontal: 6,
    paddingVertical: 10,
    fontSize: 11,
    color: 'gray',
    backgroundColor: 'white',
    textAlignVertical: 'center',
  },
  highlightedRowText: {
    color: 'black',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'lightgray',
  },
});
