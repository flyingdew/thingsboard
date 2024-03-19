///
/// Copyright © 2016-2024 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  AxisPosition,
  timeSeriesAxisPositionTranslations,
  TimeSeriesChartYAxisSettings
} from '@home/components/widget/lib/chart/time-series-chart.models';
import { MatButton } from '@angular/material/button';
import { TbPopoverService } from '@shared/components/popover.service';
import { coerceBoolean } from '@shared/decorators/coercion';
import {
  TimeSeriesChartYAxisSettingsPanelComponent
} from '@home/components/widget/lib/settings/common/chart/time-series-chart-y-axis-settings-panel.component';
import { deepClone } from '@core/utils';

@Component({
  selector: 'tb-time-series-chart-y-axis-row',
  templateUrl: './time-series-chart-y-axis-row.component.html',
  styleUrls: ['./time-series-chart-y-axis-row.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeSeriesChartYAxisRowComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None
})
export class TimeSeriesChartYAxisRowComponent implements ControlValueAccessor, OnInit {

  axisPositions = [AxisPosition.left, AxisPosition.right];

  timeSeriesAxisPositionTranslations = timeSeriesAxisPositionTranslations;

  @Input()
  disabled: boolean;

  @Input()
  @coerceBoolean()
  advanced = false;

  @Output()
  axisRemoved = new EventEmitter();

  axisFormGroup: UntypedFormGroup;

  modelValue: TimeSeriesChartYAxisSettings;

  private propagateChange = (_val: any) => {};

  constructor(private fb: UntypedFormBuilder,
              private popoverService: TbPopoverService,
              private renderer: Renderer2,
              private viewContainerRef: ViewContainerRef,
              private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.axisFormGroup = this.fb.group({
      label: [null, []],
      position: [null, []],
      units: [null, []],
      decimals: [null, []],
      min: [null, []],
      max: [null, []],
      show: [null, []]
    });
    this.axisFormGroup.valueChanges.subscribe(
      () => this.updateModel()
    );
    this.axisFormGroup.get('show').valueChanges.subscribe(() => {
      this.updateValidators();
    });
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(_fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.axisFormGroup.disable({emitEvent: false});
    } else {
      this.axisFormGroup.enable({emitEvent: false});
      this.updateValidators();
    }
  }

  writeValue(value: TimeSeriesChartYAxisSettings): void {
    this.modelValue = value;
    this.axisFormGroup.patchValue(
      {
        label: value.label,
        position: value.position,
        units: value.units,
        decimals: value.decimals,
        min: value.min,
        max: value.max,
        show: value.show,
      }, {emitEvent: false}
    );
    this.updateValidators();
    this.cd.markForCheck();
  }

  editAxis($event: Event, matButton: MatButton) {
    if ($event) {
      $event.stopPropagation();
    }
    const trigger = matButton._elementRef.nativeElement;
    if (this.popoverService.hasPopover(trigger)) {
      this.popoverService.hidePopover(trigger);
    } else {
      const ctx: any = {
        yAxisSettings: deepClone(this.modelValue),
        advanced: this.advanced
      };
      const yAxisSettingsPanelPopover = this.popoverService.displayPopover(trigger, this.renderer,
        this.viewContainerRef, TimeSeriesChartYAxisSettingsPanelComponent, ['leftOnly', 'leftTopOnly', 'leftBottomOnly'], true, null,
        ctx,
        {},
        {}, {}, true);
      yAxisSettingsPanelPopover.tbComponentRef.instance.popover = yAxisSettingsPanelPopover;
      yAxisSettingsPanelPopover.tbComponentRef.instance.yAxisSettingsApplied.subscribe((yAxisSettings) => {
        yAxisSettingsPanelPopover.hide();
        this.modelValue = {...this.modelValue, ...yAxisSettings};
        this.axisFormGroup.patchValue(
          {
            label: this.modelValue.label,
            position: this.modelValue.position,
            units: this.modelValue.units,
            decimals: this.modelValue.decimals,
            min: this.modelValue.min,
            max: this.modelValue.max,
            show: this.modelValue.show
          },
          {emitEvent: false});
        this.updateValidators();
        this.propagateChange(this.modelValue);
      });
    }
  }

  private updateValidators() {
    const show: boolean = this.axisFormGroup.get('show').value;
    if (show) {
      this.axisFormGroup.get('label').enable({emitEvent: false});
      this.axisFormGroup.get('position').enable({emitEvent: false});
      this.axisFormGroup.get('units').enable({emitEvent: false});
      this.axisFormGroup.get('decimals').enable({emitEvent: false});
    } else {
      this.axisFormGroup.get('label').disable({emitEvent: false});
      this.axisFormGroup.get('position').disable({emitEvent: false});
      this.axisFormGroup.get('units').disable({emitEvent: false});
      this.axisFormGroup.get('decimals').disable({emitEvent: false});
    }
  }

  private updateModel() {
    const value = this.axisFormGroup.value;
    this.modelValue.label = value.label;
    this.modelValue.position = value.position;
    this.modelValue.units = value.units;
    this.modelValue.decimals = value.decimals;
    this.modelValue.min = value.min;
    this.modelValue.max = value.max;
    this.modelValue.show = value.show;
    this.propagateChange(this.modelValue);
  }
}
