import RNDateTimePicker, {
  BaseProps,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { cloneDeep, get } from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Button, ButtonProps } from '../../Button';
import { format, parseISO, RNFunctionComponent } from '../../helpers';
import withConfig from '../../helpers/withConfig';
import { Modal } from '../../Modal';
import { View } from '../../View';

type TDate = 'date' | 'time' | 'datetime';
export type DateInputMethods = {
  getState: () => {
    value: string;
    tempValue: Date;
    type: TDate;
    mode: Omit<TDate, 'datetime'>;
    visible: false;
  };
};
export interface DateInputProps extends ButtonProps {
  placeholder?: string;
  type?: TDate;
  value?: string;
  valueFormat?: string;
  labelFormat?: string;
  onChange?: (value: Date) => void;
  onChangeValue?: (value: string) => void;
  datePickerProps?: Partial<
    Omit<BaseProps, 'value' | 'mode' | 'display' | 'themeVariant' | 'onChange'>
  >;
}

const _DateInput: RNFunctionComponent<DateInputProps> = forwardRef(
  (
    {
      type = 'date',
      value,
      placeholder,
      labelFormat,
      valueFormat,
      children,
      theme,
      datePickerProps,
      style,
      onLayout,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [state, setState] = useState({
      tempValue: new Date(),
      value: '',
      type: type,
      mode: type === 'datetime' ? 'date' : type,
      visible: false,
    });

    const parseValue = useCallback(
      (value: Date) => {
        if (type === 'datetime') {
          if (valueFormat) {
            return format(value, valueFormat);
          }
          return value.toJSON();
        }
        if (type === 'time') {
          return value.toJSON();
        }
        return format(value, valueFormat || 'yyyy-MM-dd');
      },
      [valueFormat, type]
    );

    const toggleModal = useCallback(
      (e: any) => {
        setState((state) => ({ ...state, visible: !state.visible }));
        setTimeout(() => {
          if (!state.visible) {
            if (!!onFocus) {
              onFocus(e);
            }
          }
          if (!!state.visible) {
            if (!!onBlur) {
              onBlur(e);
            }
          }
        }, 0);
      },
      [state, onFocus, onBlur]
    );

    const _handleAndroid = useCallback(
      (event: DateTimePickerEvent, date?: Date) => {
        if (event.type !== 'dismissed' && !!date) {
          if (state.type === 'datetime' && state.mode === 'date') {
            setState((state) => ({ ...state, tempValue: date, mode: 'time' }));
          } else if (!!date) {
            setState((state) => ({
              ...state,
              tempValue: date || state.tempValue,
              value: parseValue(date),
              mode: type === 'datetime' ? 'date' : type,
            }));
            toggleModal(event);
          }
        } else {
          setState((state) => ({
            ...state,
            tempValue: !!state.value ? parseISO(state.value) : new Date(),
            mode: type === 'datetime' ? 'date' : type,
          }));
          if (state.visible) {
            toggleModal(event);
          }
        }
      },
      [state, parseValue, toggleModal]
    );
    const _handleIOS = useCallback(
      (dismiss: boolean = true) => {
        if (!dismiss) {
          if (state.type === 'datetime' && state.mode === 'date') {
            setState((state) => ({ ...state, mode: 'time' }));
          } else {
            setState((state) => ({
              ...state,
              value: parseValue(state.tempValue),
              mode: type === 'datetime' ? 'date' : type,
            }));
            toggleModal(dismiss);
          }
        } else {
          setState((state) => ({
            ...state,
            tempValue: !!state.value ? parseISO(state.value) : new Date(),
            mode: type === 'datetime' ? 'date' : type,
          }));
          if (state.visible) {
            toggleModal(dismiss);
          }
        }
      },
      [state, parseValue, toggleModal]
    );
    const _onChange = useCallback(
      (event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') {
          _handleAndroid(event, date);
        } else if (Platform.OS === 'ios') {
          setState((state) => ({
            ...state,
            tempValue: date || state.tempValue,
          }));
        }
      },
      [_handleAndroid, _handleIOS]
    );

    const label = useMemo(() => {
      let _labelFormat = labelFormat || type === 'time' ? 'HH:mm' : 'EEEE MMM d, yyyy';
      if (!state.value) {
        return placeholder;
      }
      if (type === 'datetime') {
        _labelFormat = `${_labelFormat} HH:mm`;
      }
      return format(state.tempValue, _labelFormat);
    }, [state, type, value, labelFormat, placeholder]);

    useImperativeHandle(
      ref,
      () =>
        Object.assign({
          getState: () => cloneDeep(state),
          focus: () => {
            toggleModal(state);
          },
        }) as DateInputMethods,
      [state]
    );

    useEffect(() => {
      if (value) {
        setState((state) => ({
          ...state,
          tempValue: parseISO(value),
          value: value,
        }));
      }
    }, [value]);

    const finalButtonStyle = StyleSheet.flatten([
      styles.button,
      {
        backgroundColor: get(style, 'backgroundColor', theme?.colors.grey500),
      },
      style,
    ]);
    const finalContainerButtonStyle = StyleSheet.flatten([styles.containerButton]);
    const finalLabelButtonStyle = StyleSheet.flatten([
      styles.label,
      {
        color: theme?.colors.black,
      },
    ]);

    return (
      <>
        <Button
          {...props}
          variant="text"
          style={finalButtonStyle}
          containerStyle={finalContainerButtonStyle}
          onPress={toggleModal}
          containerProps={{ onLayout }}
        >
          {!!children ? (
            children
          ) : (
            <>
              <Button.Label style={finalLabelButtonStyle}>{label}</Button.Label>
              <Button.RightIcon
                name={type === 'time' ? 'time' : 'calendar'}
                color={theme?.colors.grey500}
              />
            </>
          )}
        </Button>
        {state.visible && Platform.OS === 'android' ? (
          <RNDateTimePicker
            {...datePickerProps}
            onChange={_onChange}
            mode={state.mode}
            value={state.tempValue}
            themeVariant={theme?.mode}
          />
        ) : Platform.OS === 'ios' ? (
          <Modal
            position="bottom"
            insetBottom
            isOpen={state.visible}
            onDismiss={() => _handleIOS()}
          >
            <View style={styles.modal}>
              <RNDateTimePicker
                {...datePickerProps}
                onChange={_onChange}
                mode={state.mode}
                value={state.tempValue}
                themeVariant={theme?.mode}
                display="spinner"
              />
              <View style={styles.wrapperButton}>
                <Button variant="text" onPress={() => _handleIOS()}>
                  <Button.Label>CANCEL</Button.Label>
                </Button>
                <Button variant="text" onPress={() => _handleIOS(false)}>
                  <Button.Label>OK</Button.Label>
                </Button>
              </View>
            </View>
          </Modal>
        ) : null}
      </>
    );
  }
);

const styles = StyleSheet.create({
  button: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  containerButton: {
    flexGrow: 1,
    margin: 0,
    borderRadius: 0,
  },
  modal: {
    padding: 16,
  },
  wrapperButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  label: {
    textAlign: 'left',
    marginLeft: 0,
    fontWeight: '400',
  },
  scrollView: {
    padding: 20,
  },
});

_DateInput.displayName = 'Input.Date';
export const DateInput = withConfig(_DateInput);
