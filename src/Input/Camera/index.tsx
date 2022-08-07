import { cloneDeep, get } from 'lodash';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Appbar } from '../../Appbar';
import { Button, ButtonProps } from '../../Button';
import type { RNFunctionComponent } from '../../helpers';
import withConfig from '../../helpers/withConfig';
import { Modal } from '../../Modal';
import { Text } from '../../Text';
import { View } from '../../View';

export type CameraInputMethod = {
  getState: () => {
    tempValue: Date;
    value: string;
    visible: boolean;
  };
  focus: () => void;
};
export interface CameraInputProps extends ButtonProps {
  value?: string;
}

const _CameraInput: RNFunctionComponent<CameraInputProps> = forwardRef(
  ({ children, value, style, theme, onLayout, onFocus, onBlur, ...props }, ref) => {
    const [state, setState] = useState({
      tempValue: '',
      value: '-',
      visible: false,
    });

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

    useImperativeHandle(
      ref,
      () =>
        Object.assign({
          getState: () => cloneDeep(state),
          focus: () => {
            toggleModal(state);
          },
        }) as CameraInputMethod,
      [state]
    );

    useEffect(() => {
      if (value) {
        setState((state) => ({
          ...state,
          tempValue: '',
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
          {!!children && children}
          <>
            <Button.LeftIcon name="camera" color={theme?.colors.grey500} size={36} />
            <Button.Label style={finalLabelButtonStyle}>Press to open camera</Button.Label>
          </>
        </Button>
        <Modal position="full" isOpen={state.visible}>
          <Appbar insetTop>
            <Text>Top Action</Text>
          </Appbar>
          <View style={styles.modal}>
            <Text>lala</Text>
          </View>
          <Appbar insetBottom>
            <Text>Bottom Action</Text>
          </Appbar>
        </Modal>
      </>
    );
  }
);

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    paddingHorizontal: 4,
    height: 120,
    flexDirection: 'column',
    alignItems: 'center',
  },
  containerButton: {
    flexGrow: 1,
    margin: 0,
    borderRadius: 0,
  },
  modal: {
    padding: 16,
    flex: 1,
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

_CameraInput.displayName = 'Input.Camera';
export const CameraInput = withConfig(_CameraInput);
