import { useForm, useWatch } from 'react-hook-form';
import { memo } from 'react';
import type { ImageFormat } from '@imgo/shared-js';
import { HiMiniArrowLongRight } from 'react-icons/hi2';
import type { ImageObjectExt, ImageOptimizeOptions, Task } from '@/types';
import { POPULAR_FORMAT_OPTIONS } from '@/constants/format-options';
import { supportsLossless } from '@/constants/format';
import { mutations } from '@/store';
import { displayFormat } from '@/lib/utils';
import { i18n } from '@/lib/i18n';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Button } from '../ui/button';
import { Select } from '../std/select';

import { ResizeInput } from '../resize-input';

interface OptimizeOptionsProps {
  input: ImageObjectExt;
  value: ImageOptimizeOptions;
  onChange: (value: ImageOptimizeOptions) => void;
}

function OptimizeOptionsView({ input, value, onChange }: OptimizeOptionsProps) {
  const form = useForm<ImageOptimizeOptions>({
    defaultValues: value ?? {},
  });
  const outputFormat = useWatch({ control: form.control, name: 'outputFormat' });
  const lossless = useWatch({ control: form.control, name: 'options.lossless' });
  const losslessSupported = supportsLossless(outputFormat);

  const handleSubmit = (formValue: ImageOptimizeOptions) => {
    onChange({
      ...formValue,
      options: {
        ...formValue.options,
        lossless: supportsLossless(formValue.outputFormat) && formValue.options.lossless,
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          void form.handleSubmit(handleSubmit)(e);
        }}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="outputFormat"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel className="font-normal">{i18n.text('format')}</FormLabel>
                <div className="flex items-center gap-4">
                  <div>{displayFormat(input.format)}</div>
                  <HiMiniArrowLongRight className="text-base" />
                  <FormControl>
                    <Select<ImageFormat>
                      value={field.value}
                      onChange={(format) => {
                        field.onChange(format);
                        if (!supportsLossless(format)) {
                          form.setValue('options.lossless', false);
                        }
                      }}
                      placeholder={i18n.text('output_format')}
                      triggerClassName="w-[126px]"
                      options={POPULAR_FORMAT_OPTIONS}
                    />
                  </FormControl>
                </div>
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="options.quality"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel className="font-normal">{i18n.text('quality')}</FormLabel>
                <div className="flex items-center gap-4">
                  <FormControl>
                    <Slider
                      className="w-[160px]"
                      min={10}
                      max={100}
                      disabled={lossless}
                      value={[field.value ?? 85]}
                      onValueChange={([val]) => field.onChange(val)}
                    >
                      <span className="absolute -right-10 text-sm">{field.value ?? 85}%</span>
                    </Slider>
                  </FormControl>
                  <FormField
                    control={form.control}
                    name="options.lossless"
                    render={({ field: losslessField }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={losslessSupported && Boolean(losslessField.value)}
                            disabled={!losslessSupported}
                            onCheckedChange={(checked) => losslessField.onChange(checked === true)}
                          />
                        </FormControl>
                        <FormLabel className="font-normal !mt-0">{i18n.text('lossless')}</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name={'options.resize'}
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel className="font-normal">{i18n.text('resize')}</FormLabel>
                <FormControl>
                  <ResizeInput value={field.value ?? null} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="options.preserve_metadata"
          render={({ field }) => {
            return (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal !mt-0">{i18n.text('preserve_exif')}</FormLabel>
                </div>
              </FormItem>
            );
          }}
        />

        <Button type="submit" variant="outline">
          {i18n.text('regenerate')}
        </Button>
      </form>
    </Form>
  );
}

interface OptimizeOptionsCardProps {
  task: Task;
}

export const OptimizeOptionsCard = memo(function OptimizeOptionsCard({
  task,
}: OptimizeOptionsCardProps) {
  const handleOptionsChange = (imageOptimizeOptions: ImageOptimizeOptions) => {
    if (task) {
      mutations.updateTaskOptions(task.id, imageOptimizeOptions);
    }
  };

  return (
    <div
      className="fixed left-4 bottom-4 shadow rounded px-4 bg-card"
      css={{
        width: 320,
      }}
    >
      <Accordion type="single" defaultValue="item-1" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-0">
          <AccordionTrigger className="hover:no-underline">
            {i18n.text('configuration')}
          </AccordionTrigger>
          <AccordionContent>
            <OptimizeOptionsView
              input={task.input}
              value={{
                options: task.options,
                outputFormat: task.outputFormat,
              }}
              onChange={handleOptionsChange}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
});
