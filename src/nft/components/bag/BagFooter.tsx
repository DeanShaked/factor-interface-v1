import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'

import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, NFTEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { SupportedChainId } from 'constants/chains'
import { useBag } from 'nft/hooks/useBag'
import { useWalletBalance } from 'nft/hooks/useWalletBalance'
import { BagStatus } from 'nft/types'
import { ethNumberStandardFormatter, formatWeiToDecimal } from 'nft/utils'
import { PropsWithChildren, useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import { useToggleWalletModal } from 'state/application/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { switchChain } from 'utils/switchChain'

const FooterContainer = styled.div`
  padding: 0px 12px;
`

const Footer = styled.div`
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  color: ${({ theme }) => theme.textPrimary};
  display: flex;
  flex-direction: column;
  margin: 0px 16px 8px;
  padding: 12px 0px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
`

const FooterHeader = styled(Column)<{ warningText?: boolean }>`
  padding-top: 8px;
  padding-bottom: ${({ warningText }) => (warningText ? '8px' : '20px')};
`

const WarningIcon = styled(AlertTriangle)`
  width: 14px;
  margin-right: 4px;
  color: ${({ theme }) => theme.accentWarning};
`
const WarningText = styled(ThemedText.BodyPrimary)`
  align-items: center;
  color: ${({ theme }) => theme.accentWarning};
  display: flex;
  justify-content: center;
  margin: 12px 0 !important;
  text-align: center;
`

const PayButton = styled(Row)<{ disabled?: boolean }>`
  background: ${({ theme }) => theme.accentAction};
  color: ${({ theme }) => theme.accentTextLightPrimary};
  font-weight: 600;
  line-height: 24px;
  font-size: 16px;
  gap: 16px;
  justify-content: center;
  border: none;
  border-radius: 12px;
  padding: 12px 0px;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  cursor: ${({ disabled }) => (disabled ? 'auto' : 'pointer')};
`

interface ActionButtonProps {
  disabled?: boolean
  onClick: () => void
}

const ActionButton = ({ disabled, children, onClick }: PropsWithChildren<ActionButtonProps>) => {
  return (
    <PayButton disabled={disabled} onClick={onClick}>
      {children}
    </PayButton>
  )
}

const Warning = ({ children }: PropsWithChildren<unknown>) => {
  if (!children) {
    return null
  }
  return (
    <WarningText fontSize="14px" lineHeight="20px">
      <WarningIcon />
      {children}
    </WarningText>
  )
}

interface BagFooterProps {
  totalEthPrice: BigNumber
  totalUsdPrice: number | undefined
  bagStatus: BagStatus
  fetchAssets: () => void
  eventProperties: Record<string, unknown>
}

const PENDING_BAG_STATUSES = [
  BagStatus.FETCHING_ROUTE,
  BagStatus.CONFIRMING_IN_WALLET,
  BagStatus.FETCHING_FINAL_ROUTE,
  BagStatus.PROCESSING_TRANSACTION,
]

export const BagFooter = ({
  totalEthPrice,
  totalUsdPrice,
  bagStatus,
  fetchAssets,
  eventProperties,
}: BagFooterProps) => {
  const toggleWalletModal = useToggleWalletModal()
  const { account, chainId, connector } = useWeb3React()
  const connected = Boolean(account && chainId)

  const setBagExpanded = useBag((state) => state.setBagExpanded)

  const { balance: balanceInEth } = useWalletBalance()
  const sufficientBalance = useMemo(() => {
    if (!connected || chainId !== SupportedChainId.MAINNET) {
      return undefined
    }
    return parseEther(balanceInEth).gte(totalEthPrice)
  }, [connected, chainId, balanceInEth, totalEthPrice])

  const { buttonText, disabled, warningText, handleClick } = useMemo(() => {
    let handleClick = fetchAssets
    let buttonText = Something went wrong
    let disabled = true
    let warningText = null

    if (connected && chainId !== SupportedChainId.MAINNET) {
      handleClick = () => switchChain(connector, SupportedChainId.MAINNET)
      buttonText = Switch networks
      disabled = false
      warningText = Wrong network
    } else if (sufficientBalance === false) {
      buttonText = Pay
      disabled = true
      warningText = Insufficient funds
    } else if (bagStatus === BagStatus.WARNING) {
      warningText = Something went wrong. Please try again.
    } else if (!connected) {
      handleClick = () => {
        toggleWalletModal()
        setBagExpanded({ bagExpanded: false })
      }
      disabled = false
      buttonText = Connect wallet
    } else if (bagStatus === BagStatus.FETCHING_FINAL_ROUTE || bagStatus === BagStatus.CONFIRMING_IN_WALLET) {
      disabled = true
      buttonText = Proceed in wallet
    } else if (bagStatus === BagStatus.PROCESSING_TRANSACTION) {
      disabled = true
      buttonText = Transaction pending
    } else if (sufficientBalance === true) {
      disabled = false
      buttonText = Pay
    }

    return { buttonText, disabled, warningText, handleClick }
  }, [bagStatus, chainId, connected, connector, fetchAssets, setBagExpanded, sufficientBalance, toggleWalletModal])

  const isPending = PENDING_BAG_STATUSES.includes(bagStatus)

  return (
    <FooterContainer>
      <Footer>
        <FooterHeader gap="xs" warningText={!!warningText}>
          <Row justify="space-between">
            <div>
              <ThemedText.HeadlineSmall>Total</ThemedText.HeadlineSmall>
            </div>
            <div>
              <ThemedText.HeadlineSmall>
                {formatWeiToDecimal(totalEthPrice.toString())}&nbsp;ETH
              </ThemedText.HeadlineSmall>
            </div>
          </Row>
          <Row justify="flex-end">
            <ThemedText.BodySmall color="textSecondary" lineHeight="20px">{`${ethNumberStandardFormatter(
              totalUsdPrice,
              true
            )}`}</ThemedText.BodySmall>
          </Row>
        </FooterHeader>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={NFTEventName.NFT_BUY_BAG_PAY}
          element={InterfaceElementName.NFT_BUY_BAG_PAY_BUTTON}
          properties={{ ...eventProperties }}
          shouldLogImpression={connected && !disabled}
        >
          <Warning>{warningText}</Warning>
          <ActionButton onClick={handleClick} disabled={disabled}>
            {isPending && <Loader size="20px" stroke="white" />}
            {buttonText}
          </ActionButton>
        </TraceEvent>
      </Footer>
    </FooterContainer>
  )
}
