import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '../ui/button';
import { TooltipIconButton } from '../ui/tooltip-icon-button';
import { HiXMark, HiCog, HiAdjustmentsHorizontal, HiOutlinePlusCircle } from 'react-icons/hi2';
import { Select } from '../std/select';
import { FullScreenModal } from '../ui/full-screen-modal';
import { mutations, useStore } from '@/store';
import { toNumber, displayFormat } from '@/lib/utils';
import { POPULAR_FORMATS, supportsLossless } from '@/constants/format';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import MultipleSelect from '../ui/multiple-select';
import {
  ALL_FORMAT,
  SAME_FORMAT,
  type SkipSaveType,
  type AppTheme,
  type AppOptions,
  type OptionInputFormat,
  type OptionOutputFormat,
} from '@/types';
import { omit } from 'lodash-es';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '../ui/sidebar';
import { useState } from 'react';
import type { IconType } from 'react-icons/lib';
import { ResizeInput } from '../resize-input';
import { DEFAULT_SKIP_SAVE_MIN_RATIO } from '@/constants/app';
import { i18n } from '@/lib/i18n';

function ThemeSelect() {
  const appTheme = useStore((state) => state.appOptions.appTheme);
  const handleChange = (value: AppTheme) => {
    mutations.updateAppOptions(
      {
        appTheme: value,
      },
      false,
    );
  };

  return (
    <Select<AppTheme>
      onChange={handleChange}
      value={appTheme}
      placeholder={i18n.text('theme_color')}
      triggerClassName="w-[200px]"
      options={[
        {
          value: 'light',
          label: i18n.text('light'),
        },
        {
          value: 'dark',
          label: i18n.text('dark'),
        },
        {
          value: 'system',
          label: i18n.text('follow_system'),
        },
      ]}
    />
  );
}

type ActiveTabKey = 'general' | 'optimize';

const menus: Array<{
  key: ActiveTabKey;
  labelKey: string;
  icon: IconType;
}> = [
  {
    key: 'optimize',
    labelKey: 'conversion_settings',
    icon: HiAdjustmentsHorizontal,
  },
  {
    key: 'general',
    labelKey: 'general',
    icon: HiCog,
  },
];

function profileSupportsLossless(
  inputFormats: OptionInputFormat[],
  outputFormat: OptionOutputFormat,
) {
  if (outputFormat !== SAME_FORMAT) {
    return supportsLossless(outputFormat);
  }

  return (
    inputFormats.length > 0 &&
    !inputFormats.includes(ALL_FORMAT) &&
    inputFormats.every((format) => format !== ALL_FORMAT && supportsLossless(format))
  );
}

function AppOptionsView({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState(menus[0].key);
  const appOptions = useStore((state) => state.appOptions);
  const visibleMenus = embedded ? menus.filter((menu) => menu.key !== 'general') : menus;

  const form = useForm<AppOptions>({
    defaultValues: appOptions,
  });

  const handleSkipSaveMinRatioBlur = () => {
    const formValues = form.getValues();
    const skipSaveMinRatio = toNumber(formValues.skipSaveMinRatio, DEFAULT_SKIP_SAVE_MIN_RATIO);
    form.setValue('skipSaveMinRatio', skipSaveMinRatio);
  };

  const submitAndClose = (formValue: AppOptions, rerunAll = false) => {
    console.log('formValue', formValue);
    mutations.updateAppOptions(
      {
        ...omit(formValue, 'appTheme'),
        skipSaveMinRatio: toNumber(formValue.skipSaveMinRatio, DEFAULT_SKIP_SAVE_MIN_RATIO),
      },
      rerunAll,
    );

    setTimeout(() => {
      mutations.setAppOptionsVisible(false);
    }, 300);
  };

  const handleSave = () => {
    const formValue = form.getValues();
    submitAndClose(formValue, false);
  };

  const handleApply = () => {
    const formValue = form.getValues();
    submitAndClose(formValue, true);
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'globalDefaultOptions',
  });
  const skipSaveType = useWatch({
    control: form.control,
    name: 'skipSaveType',
  });
  const globalDefaultOptions = useWatch({
    control: form.control,
    name: 'globalDefaultOptions',
  });

  return (
    <div className="h-full overflow-auto bg-card">
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{i18n.text('options')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleMenus.map((menu) => (
                    <SidebarMenuItem key={menu.key}>
                      <SidebarMenuButton
                        isActive={activeTab === menu.key}
                        onClick={() => setActiveTab(menu.key)}
                      >
                        <menu.icon />
                        <span>{i18n.text(menu.labelKey)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter />
        </Sidebar>

        <div className="max-w-[520px] m-8">
          <Form {...form}>
            <form
              // onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
              {activeTab === 'optimize' && (
                <>
                  <FormItem>
                    <FormLabel>{i18n.text('conversion_profiles')}</FormLabel>

                    {fields.map((field, index) => {
                      const profile = globalDefaultOptions[index] ?? field;
                      const losslessSupported = profileSupportsLossless(
                        profile.inputFormats,
                        profile.outputFormat,
                      );

                      return (
                        <div
                          key={field.id}
                          className="space-y-4 p-4 border rounded-lg relative bg-card"
                        >
                          <TooltipIconButton
                            type="button"
                            variant="ghost"
                            tooltip={i18n.text('delete_conversion_profile')}
                            aria-label={i18n.text('delete_conversion_profile')}
                            className="absolute right-0 top-0 px-2"
                            onClick={() => remove(index)}
                          >
                            <HiXMark className="text-lg" />
                          </TooltipIconButton>
                          <FormField
                            control={form.control}
                            name={`globalDefaultOptions.${index}.inputFormats`}
                            render={({ field }) => {
                              const handleChangeInputFormats = (
                                inputFormats: OptionInputFormat[],
                              ) => {
                                const prevIncludeAll = field.value.includes(ALL_FORMAT);
                                const currExcludeAll = inputFormats.filter(
                                  (item) => item !== ALL_FORMAT,
                                );
                                const nextInputFormats: OptionInputFormat[] =
                                  prevIncludeAll && currExcludeAll.length
                                    ? currExcludeAll
                                    : inputFormats.includes(ALL_FORMAT)
                                      ? [ALL_FORMAT]
                                      : inputFormats;

                                field.onChange(nextInputFormats);

                                if (
                                  !profileSupportsLossless(nextInputFormats, profile.outputFormat)
                                ) {
                                  form.setValue(
                                    `globalDefaultOptions.${index}.options.lossless`,
                                    false,
                                  );
                                }
                              };

                              return (
                                <FormItem>
                                  <FormLabel className="font-normal">
                                    {i18n.text('input_formats')}
                                  </FormLabel>
                                  <FormControl>
                                    <MultipleSelect<OptionInputFormat>
                                      value={field.value}
                                      options={([ALL_FORMAT, ...POPULAR_FORMATS] as const).map(
                                        (format) => ({
                                          value: format,
                                          label: displayFormat(format),
                                        }),
                                      )}
                                      onChange={handleChangeInputFormats}
                                    />
                                  </FormControl>
                                  {/* <FormDescription>This is your public display name.</FormDescription> */}
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          <FormField
                            control={form.control}
                            name={`globalDefaultOptions.${index}.outputFormat`}
                            render={({ field }) => {
                              const handleChangeOutputFormat = (
                                outputFormat: OptionOutputFormat,
                              ) => {
                                field.onChange(outputFormat);
                                if (!profileSupportsLossless(profile.inputFormats, outputFormat)) {
                                  form.setValue(
                                    `globalDefaultOptions.${index}.options.lossless`,
                                    false,
                                  );
                                }
                              };

                              return (
                                <FormItem>
                                  <FormLabel className="font-normal">
                                    {i18n.text('output_format')}
                                  </FormLabel>
                                  <FormControl>
                                    <Select<OptionOutputFormat>
                                      value={field.value}
                                      onChange={handleChangeOutputFormat}
                                      placeholder={i18n.text('output_format')}
                                      triggerClassName="w-[200px]"
                                      options={([SAME_FORMAT, ...POPULAR_FORMATS] as const).map(
                                        (format) => ({
                                          value: format,
                                          label: displayFormat(format),
                                        }),
                                      )}
                                    />
                                  </FormControl>
                                  {/* <FormDescription>This is your public display name.</FormDescription> */}
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          <FormField
                            control={form.control}
                            name={`globalDefaultOptions.${index}.options.quality`}
                            render={({ field }) => {
                              return (
                                <FormItem>
                                  <FormLabel className="font-normal">
                                    {i18n.text('quality')}
                                  </FormLabel>
                                  <div className="flex items-center gap-4">
                                    <FormControl>
                                      <Slider
                                        className="w-[160px]"
                                        min={10}
                                        max={100}
                                        disabled={profile.options.lossless}
                                        value={[field.value ?? 85]}
                                        onValueChange={([val]) => field.onChange(val)}
                                      >
                                        <span className="absolute -right-10 text-sm">
                                          {field.value ?? 85}%
                                        </span>
                                      </Slider>
                                    </FormControl>
                                    <FormField
                                      control={form.control}
                                      name={`globalDefaultOptions.${index}.options.lossless`}
                                      render={({ field: losslessField }) => (
                                        <FormItem className="flex items-center gap-2">
                                          <FormControl>
                                            <Checkbox
                                              checked={
                                                losslessSupported && Boolean(losslessField.value)
                                              }
                                              disabled={!losslessSupported}
                                              onCheckedChange={(checked) =>
                                                losslessField.onChange(checked === true)
                                              }
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal !mt-0">
                                            {i18n.text('lossless')}
                                          </FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <FormDescription>
                                    {i18n.text('quality_description')}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          <FormField
                            control={form.control}
                            name={`globalDefaultOptions.${index}.options.resize`}
                            render={({ field }) => {
                              return (
                                <FormItem>
                                  <FormLabel className="font-normal">
                                    {i18n.text('downsize')}
                                  </FormLabel>
                                  <FormControl>
                                    <ResizeInput
                                      value={field.value ?? null}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          <FormField
                            control={form.control}
                            name={`globalDefaultOptions.${index}.options.preserve_metadata`}
                            render={({ field }) => {
                              return (
                                <FormItem>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Switch
                                        checked={field.value ?? true}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal !mt-0">
                                      {i18n.text('preserve_exif')}
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        </div>
                      );
                    })}

                    <Button
                      variant="ghost"
                      onClick={() =>
                        append({
                          inputFormats: [],
                          outputFormat: SAME_FORMAT,
                          options: {
                            quality: 75,
                          },
                        })
                      }
                    >
                      <HiOutlinePlusCircle />
                      {i18n.text('add_conversion_profile')}
                    </Button>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="skipSaveType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{i18n.text('skip_oversized')}</FormLabel>
                        <FormControl>
                          <Select<SkipSaveType>
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={i18n.text('skip_method')}
                            triggerClassName="w-[200px]"
                            options={[
                              {
                                value: 'NONE',
                                label: i18n.text('skip_none'),
                              },
                              {
                                value: 'SAME_FORMAT',
                                label: i18n.text('same_format'),
                              },
                              {
                                value: 'ALL',
                                label: i18n.text('all_formats'),
                              },
                            ]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {skipSaveType !== 'NONE' && (
                    <FormField
                      control={form.control}
                      name="skipSaveMinRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{i18n.text('skip_ratio')}</FormLabel>
                          <FormControl>
                            <Input
                              className="w-[200px]"
                              type="number"
                              step={0.1}
                              {...field}
                              onBlur={handleSkipSaveMinRatioBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleSave}>{i18n.text('save')}</Button>
                    <Button variant="secondary" onClick={handleApply}>
                      {i18n.text('apply_now')}
                    </Button>
                  </div>
                </>
              )}

              {!embedded && activeTab === 'general' && (
                <FormItem>
                  <FormLabel>{i18n.text('theme_color')}</FormLabel>
                  <ThemeSelect />
                </FormItem>
              )}
            </form>
          </Form>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default function AppOptionsWithModal({ embedded = false }: { embedded?: boolean }) {
  const appOptionsVisible = useStore((state) => state.appOptionsVisible);

  return (
    <FullScreenModal
      show={appOptionsVisible}
      onClose={() => mutations.setAppOptionsVisible(false)}
      contained={embedded}
    >
      <AppOptionsView embedded={embedded} />
    </FullScreenModal>
  );
}
