'use client';

import Script from 'next/script';
import { AlertCircle } from 'lucide-react';
import { LoginModal } from '@/components/landing/LoginModal';
import { AddressSearchModal } from '@/components/consultation/AddressSearchModal';
import { useEnforcementFineCalculator } from '@/components/enforcement-fine/useEnforcementFineCalculator';
import { CalcHeader } from '@/components/enforcement-fine/CalcHeader';
import { StepNav } from '@/components/enforcement-fine/StepNav';
import { Step1AddressCard } from '@/components/enforcement-fine/Step1AddressCard';
import { Step2BuildingCard } from '@/components/enforcement-fine/Step2BuildingCard';
import { Step3ExtraCard } from '@/components/enforcement-fine/Step3ExtraCard';
import { Step4ViolationCard } from '@/components/enforcement-fine/Step4ViolationCard';
import { ResultAside } from '@/components/enforcement-fine/ResultAside';
import { MobileStickyBar } from '@/components/enforcement-fine/MobileStickyBar';
import { ViolationPickerModal } from '@/components/enforcement-fine/ViolationPickerModal';

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share?: {
        sendDefault: (template: {
          objectType: 'feed';
          content: {
            title: string;
            description: string;
            imageUrl: string;
            imageWidth: number;
            imageHeight: number;
            link: { mobileWebUrl: string; webUrl: string };
          };
          buttons: Array<{
            title: string;
            link: { mobileWebUrl: string; webUrl: string };
          }>;
        }) => void;
      };
    };
  }
}

const KAKAO_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
const CALC_SHARE_ORIGIN = 'https://www.archlegal.co.kr';
const CALC_SHARE_IMAGE_URL = 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/kakao_c.png';

type EnforcementFineCalculatorClientProps = {
  showInternalCalculationDetails?: boolean;
  loginNextPath?: string;
};

export function EnforcementFineCalculatorClient({
  showInternalCalculationDetails = false,
  loginNextPath = '/calc'
}: EnforcementFineCalculatorClientProps = {}) {
  const {
    // refs
    headerRef,
    resultCardRef,
    // session
    session,
    // address / building-info state
    address,
    selectedAddress,
    dongName,
    setDongName,
    hoName,
    setHoName,
    building,
    selectedUnit,
    reference,
    preparedData,
    // violation-info state + setters
    areaUnit,
    setAreaUnit,
    violationArea,
    setViolationArea,
    violationType,
    violationCompletedYear,
    setViolationCompletedYear,
    violationStructureIndexId,
    setViolationStructureIndexId,
    setViolationUseIndexId,
    setViolationUseCategoryKey,
    setUseCategoryManuallyChanged,
    extensionConstructionType,
    setExtensionConstructionType,
    majorRepairApprovalType,
    setMajorRepairApprovalType,
    majorRepairRoofReductionApplied,
    setMajorRepairRoofReductionApplied,
    selectedAdditionCodes,
    setSelectedAdditionCodes,
    selectedReductionCodes,
    setSelectedReductionCodes,
    aggravationId,
    setAggravationId,
    mitigationId,
    setMitigationId,
    residentialSpecialId,
    setResidentialSpecialId,
    setAcquiredAfterViolation,
    setResult,
    // options data
    structureOptions,
    useOptions,
    specialConditionOptions,
    extensionConstructionOptions,
    // loading flags
    loadingTypes,
    loadingStructures,
    loadingUses,
    loadingAdjustments,
    loadingSpecialConditions,
    loadingExtensionConstructionOptions,
    preparing,
    calculating,
    // result / errors / step
    result,
    errorMessage,
    currentStep,
    setCurrentStep,
    // derived values
    selectedViolationLabel,
    groupedViolationOptions,
    selectedUseOption,
    displayedUseCategoryKey,
    displayedUseIndexId,
    isMajorRepairType,
    isUseChangeType,
    resultViolationLabel,
    violationBasis,
    criteriaInputRows,
    criteriaIntermediateRows,
    adjustmentItems,
    specialConditionItems,
    hasEstimatedRange,
    additionOptions,
    reductionOptions,
    aggravationOptions,
    mitigationOptions,
    residentialSpecialOptions,
    filteredUseOptionGroups,
    canPrepare,
    canContinueBuildingInfo,
    canCalculate,
    // ui toggles
    loginOpen,
    setLoginOpen,
    authError,
    setAuthError,
    addressSearchOpen,
    setAddressSearchOpen,
    criteriaOpen,
    setCriteriaOpen,
    violationExamplesOpen,
    setViolationExamplesOpen,
    violationPickerOpen,
    setViolationPickerOpen,
    shareToast,
    setShareToast,
    // handlers
    requireLogin,
    clearPreparedCalculation,
    handleAddressSelect,
    openAddressSearch,
    handleViolationTypeChange,
    openViolationPicker,
    prepareBuilding,
    calculateFine,
    reset,
    // loaders (used by JSX onFocus)
    loadStructureOptions,
    loadUseOptions,
    loadSpecialConditionOptions,
    loadExtensionConstructionOptions,
    // scroll helper
    scrollResultCardIntoView
  } = useEnforcementFineCalculator();

  const initializeKakaoSdk = () => {
    if (!KAKAO_JAVASCRIPT_KEY || !window.Kakao || window.Kakao.isInitialized()) return;
    window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
  };

  const fallbackShareCalcLink = async (shareUrl: string) => {
    if (navigator.share) {
      await navigator.share({ title: '이행강제금 계산기', url: shareUrl });
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    setShareToast('링크가 복사되었습니다.');
  };

  const shareCalcLink = async () => {
    const shareUrl = `${CALC_SHARE_ORIGIN}/calc`;

    try {
      initializeKakaoSdk();

      if (window.Kakao?.Share && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: '이행강제금 계산기',
            description: '위반건축물 이행강제금을 공식 기준으로 직접 계산해보세요.',
            imageUrl: CALC_SHARE_IMAGE_URL,
            imageWidth: 800,
            imageHeight: 800,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
          },
          buttons: [
            {
              title: '계산기 바로가기',
              link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
            }
          ]
        });
        return;
      }

      await fallbackShareCalcLink(shareUrl);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        await fallbackShareCalcLink(shareUrl);
      } catch {
        setShareToast('공유를 지원하지 않는 브라우저입니다. 주소창의 링크를 복사해주세요.');
      }
    }
  };

  return (
    <main className="calc-root bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <CalcHeader
          headerRef={headerRef}
          kakaoShareEnabled={Boolean(KAKAO_JAVASCRIPT_KEY)}
          onShareCalc={shareCalcLink}
        />

        {errorMessage ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {shareToast ? (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-sm text-white shadow-lg">
            {shareToast}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="order-1 space-y-4">
            <StepNav
              preparedData={preparedData}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
            />

            {currentStep === 1 ? (
              <Step1AddressCard
                address={address}
                selectedAddress={selectedAddress}
                dongName={dongName}
                setDongName={setDongName}
                hoName={hoName}
                setHoName={setHoName}
                session={session}
                clearPreparedCalculation={clearPreparedCalculation}
                requireLogin={requireLogin}
                openAddressSearch={openAddressSearch}
                prepareBuilding={prepareBuilding}
                canPrepare={canPrepare}
                preparing={preparing}
                preparedData={preparedData}
                setCurrentStep={setCurrentStep}
              />
            ) : null}

            {currentStep === 2 && preparedData ? (
              <Step2BuildingCard
                preparedData={preparedData}
                selectedUnit={selectedUnit}
                building={building}
                violationStructureIndexId={violationStructureIndexId}
                setViolationStructureIndexId={setViolationStructureIndexId}
                setResult={setResult}
                structureOptions={structureOptions}
                loadingStructures={loadingStructures}
                loadStructureOptions={loadStructureOptions}
                displayedUseCategoryKey={displayedUseCategoryKey}
                setViolationUseCategoryKey={setViolationUseCategoryKey}
                setUseCategoryManuallyChanged={setUseCategoryManuallyChanged}
                setViolationUseIndexId={setViolationUseIndexId}
                useOptions={useOptions}
                loadingUses={loadingUses}
                loadUseOptions={loadUseOptions}
                displayedUseIndexId={displayedUseIndexId}
                reference={reference}
                filteredUseOptionGroups={filteredUseOptionGroups}
                selectedUseOption={selectedUseOption}
                canContinueBuildingInfo={canContinueBuildingInfo}
                setCurrentStep={setCurrentStep}
              />
            ) : null}

            {currentStep === 3 && preparedData ? (
              <Step3ExtraCard
                selectedAdditionCodes={selectedAdditionCodes}
                setSelectedAdditionCodes={setSelectedAdditionCodes}
                additionOptions={additionOptions}
                selectedReductionCodes={selectedReductionCodes}
                setSelectedReductionCodes={setSelectedReductionCodes}
                reductionOptions={reductionOptions}
                loadingAdjustments={loadingAdjustments}
                setResult={setResult}
                extensionConstructionType={extensionConstructionType}
                setExtensionConstructionType={setExtensionConstructionType}
                extensionConstructionOptions={extensionConstructionOptions}
                loadingExtensionConstructionOptions={loadingExtensionConstructionOptions}
                loadExtensionConstructionOptions={loadExtensionConstructionOptions}
                setCurrentStep={setCurrentStep}
              />
            ) : null}

            {currentStep === 4 && preparedData ? (
              <Step4ViolationCard
                violationArea={violationArea}
                setViolationArea={setViolationArea}
                setResult={setResult}
                areaUnit={areaUnit}
                setAreaUnit={setAreaUnit}
                violationCompletedYear={violationCompletedYear}
                setViolationCompletedYear={setViolationCompletedYear}
                violationExamplesOpen={violationExamplesOpen}
                setViolationExamplesOpen={setViolationExamplesOpen}
                selectedViolationLabel={selectedViolationLabel}
                loadingTypes={loadingTypes}
                openViolationPicker={openViolationPicker}
                violationPickerOpen={violationPickerOpen}
                isMajorRepairType={isMajorRepairType}
                majorRepairApprovalType={majorRepairApprovalType}
                setMajorRepairApprovalType={setMajorRepairApprovalType}
                majorRepairRoofReductionApplied={majorRepairRoofReductionApplied}
                setMajorRepairRoofReductionApplied={setMajorRepairRoofReductionApplied}
                aggravationId={aggravationId}
                setAggravationId={setAggravationId}
                specialConditionOptions={specialConditionOptions}
                loadingSpecialConditions={loadingSpecialConditions}
                loadSpecialConditionOptions={loadSpecialConditionOptions}
                aggravationOptions={aggravationOptions}
                mitigationId={mitigationId}
                setMitigationId={setMitigationId}
                setAcquiredAfterViolation={setAcquiredAfterViolation}
                mitigationOptions={mitigationOptions}
                residentialSpecialId={residentialSpecialId}
                setResidentialSpecialId={setResidentialSpecialId}
                residentialSpecialOptions={residentialSpecialOptions}
                isUseChangeType={isUseChangeType}
                calculateFine={calculateFine}
                canCalculate={canCalculate}
                calculating={calculating}
                setCurrentStep={setCurrentStep}
              />
            ) : null}
          </div>

          <ResultAside
            resultCardRef={resultCardRef}
            result={result}
            hasEstimatedRange={hasEstimatedRange}
            resultViolationLabel={resultViolationLabel}
            violationBasis={violationBasis}
            preparedData={preparedData}
            dongName={dongName}
            hoName={hoName}
            selectedAddress={selectedAddress}
            criteriaOpen={criteriaOpen}
            setCriteriaOpen={setCriteriaOpen}
            criteriaInputRows={criteriaInputRows}
            criteriaIntermediateRows={criteriaIntermediateRows}
            adjustmentItems={adjustmentItems}
            specialConditionItems={specialConditionItems}
            showInternalCalculationDetails={showInternalCalculationDetails}
          />
        </section>

        {result ? (
          <MobileStickyBar
            result={result}
            setCurrentStep={setCurrentStep}
            scrollResultCardIntoView={scrollResultCardIntoView}
          />
        ) : null}

      </div>

      <LoginModal
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          setAuthError(null);
        }}
        nextPath={loginNextPath}
        authError={authError}
      />
      {violationPickerOpen ? (
        <ViolationPickerModal
          setViolationPickerOpen={setViolationPickerOpen}
          loadingTypes={loadingTypes}
          groupedViolationOptions={groupedViolationOptions}
          violationType={violationType}
          handleViolationTypeChange={handleViolationTypeChange}
        />
      ) : null}
      <AddressSearchModal
        isOpen={addressSearchOpen}
        onClose={() => setAddressSearchOpen(false)}
        onSelect={handleAddressSelect}
      />

      {KAKAO_JAVASCRIPT_KEY ? (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js"
          strategy="afterInteractive"
          onLoad={initializeKakaoSdk}
        />
      ) : null}
    </main>
  );
}
