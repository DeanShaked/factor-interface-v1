
import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState } from 'hooks/usePools'
import React from 'react'
import { ThemedText } from 'theme'

export function FeeTierPercentageBadge({
  feeAmount,
  distributions,
  poolState,
}: {
  feeAmount: FeeAmount
  distributions: ReturnType<typeof useFeeTierDistribution>['distributions']
  poolState: PoolState
}) {
  return (
    <Badge>
      <ThemedText.DeprecatedLabel fontSize={10}>
        {!distributions || poolState === PoolState.NOT_EXISTS || poolState === PoolState.INVALID ? (
          Not created
        ) : distributions[feeAmount] !== undefined ? (
          {distributions[feeAmount]?.toFixed(0)}% select
        ) : (
          No data
        )}
      </ThemedText.DeprecatedLabel>
    </Badge>
  )
}
