import { specificationsStepId, selectTargetStepId, appConfigStepId, InstallOsFormik, InstallAppFormik } from './types';
import { isSpecsStepValid } from './steps/SpecificationsStep';
import { isSelectTargetStepValid } from './steps/SelectTargetStep';
import { isAppConfigStepValid } from './steps/AppConfigStep';
import { FlightCtlWizardFooterProps } from '../../common/FlightCtlWizardFooter';

export const validateOsWizardStep: FlightCtlWizardFooterProps<InstallOsFormik>['validateStep'] = (
  activeStepId,
  errors,
) => {
  if (activeStepId === specificationsStepId) return isSpecsStepValid(errors);
  if (activeStepId === selectTargetStepId) return isSelectTargetStepValid(errors);
  return true;
};

export const validateAppWizardStep: FlightCtlWizardFooterProps<InstallAppFormik>['validateStep'] = (
  activeStepId,
  errors,
  values,
) => {
  if (activeStepId === specificationsStepId) return isSpecsStepValid(errors);
  if (activeStepId === selectTargetStepId) return isSelectTargetStepValid(errors);
  if (activeStepId === appConfigStepId) return isAppConfigStepValid(values, errors);
  return true;
};
