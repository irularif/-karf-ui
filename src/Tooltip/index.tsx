import { ReactElement, useEffect, useState } from 'react';
import type { RNFunctionComponent } from '../helpers';
import withConfig from '../helpers/withConfig';
import { Popover, PopoverProps } from '../Popover';

export interface TooltipProps extends Omit<PopoverProps, 'children'> {
  content: string | ReactElement;
  children: ReactElement;
  duration?: number;
}

const _Tooltip: RNFunctionComponent<TooltipProps> = ({
  content,
  children,
  duration = 3000,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setIsVisible(false);
      }, duration);
    }
  }, [isVisible]);

  return (
    // @ts-ignore
    <Popover isOpen={isVisible} onIsOpenChanged={setIsVisible} withoutBackdrop {...props}>
      <Popover.Trigger>{children}</Popover.Trigger>
      <Popover.Content>{content}</Popover.Content>
    </Popover>
  );
};

_Tooltip.displayName = 'Tooltip';
export const Tooltip = withConfig(_Tooltip);
