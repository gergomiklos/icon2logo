import React, { useState, useEffect } from 'react';
import { RotateCcwIcon, XIcon, CopyIcon, DownloadIcon } from 'lucide-react';
import Balancer from 'react-wrap-balancer';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from '@/components/ui/separator';
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";


const SvgIconToLogoEditor = () => {
  const [ogSvg, setOgSvg] = useState('');
  const [padding, setPadding] = useState(-5);
  const [thickness, setThickness] = useState(ogSvg?.match(/stroke-width="(.*?)"/)?.[1] || 1);
  const [color, setColor] = useState(ogSvg?.match(/stroke="(.*?)"/)?.[1] || 'black');

  const [fill, setFill] = useState(false);
  const [fillColor, setFillColor] = useState(ogSvg?.match(/fill="(.*?)"/)?.[1] || color);

  const [bg, setBg] = useState(false);
  const [bgColor, setBgColor] = useState('black');
  const [radius, setRadius] = useState(10);

  const [svg, setSvg] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [downloadImage, setDownloadImage] = useState(null);
  const [downloadSize, setDownloadSize] = useState(512);

  const disabled = !ogSvg;
  const size = Math.max(
    +ogSvg?.match(/width="(\d+)"/)?.[1] || 0,
    +ogSvg?.match(/height="(\d+)"/)?.[1] || 0,
    24
  );

  const transformSvg = (svg = ogSvg) => {
    let mod = svg;

    // fix some react specific attributes
    mod = mod?.replace(/strokeWidth=/g, 'stroke-width=');
    mod = mod?.replace(/strokeLinecap=/g, 'stroke-linecap=');
    mod = mod?.replace(/strokeLinejoin=/g, 'stroke-linejoin=');
    mod = mod?.replace(/(\{|\})/g, '"'); // { or } => "

    // color 
    mod = mod?.replace(/stroke=".*?"/g, `stroke="${color}"`);

    // fill
    if (fill) {
      mod = mod?.replace(/fill=".*?"/g, `fill="${fillColor}"`);
      if (!mod?.match(/fill=".*?"/g)) {
        mod = mod?.replace(/stroke="(.*?)"/g, `stroke="${color}" fill="${fillColor}"`);
      }
    }

    // thickness
    mod = mod?.replace(/stroke-width=".*?"/g, `stroke-width="${thickness}"`);
    if (!mod?.match(/stroke-width="(.*?)"/g)) {
      mod = mod?.replace(/stroke="(.*?)"/g, `stroke="${color}" stroke-width="${thickness}"`);
    }

    // padding
    const scaleFactor = (-padding + 15) / 20;
    const translateValue = (size * (1 - scaleFactor)) / 2;
    const transformString = `transform="translate(${translateValue}, ${translateValue}) scale(${scaleFactor})"`;
    const svgElementsPattern = /<(rect|circle|path|ellipse|polygon|polyline|line)(\s[^>]*)?>/g;
    mod = mod.replace(svgElementsPattern, `<$1 ${transformString}$2>`);

    // background
    if (bg) {
      const r = radius / 20 * size;
      let bgPath = '';
      if (r >= size / 2) {
        // Circle
        bgPath = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${bgColor}" stroke="none" stroke-width="0" />`;
      } else {
        // Rounded rectangle
        bgPath = `<rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${bgColor}" stroke="none" stroke-width="0" />`;
      }
      mod = mod.replace(/<svg([^>]+)>/, `<svg$1>${bgPath}`);
    }

    return mod;
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    file && setSvg(await file.text());
    file && setOgSvg(await file.text());
  };

  const convertSvgToPng = async (canvasSize = 500, highRes = true, url = true) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = 'data:image/svg+xml;base64,' + btoa(svg);

      image.onload = () => {
        const pixelRatio = highRes ? window.devicePixelRatio || 1 : 1; // Avoid blur on retina displays

        const canvas = document.createElement('canvas');
        canvas.width = canvasSize * pixelRatio;
        canvas.height = canvasSize * pixelRatio;
        const ctx = canvas.getContext('2d');
        ctx.scale(pixelRatio, pixelRatio);

        ctx.drawImage(image, 0, 0, canvasSize, canvasSize);

        url ? resolve(canvas.toDataURL('image/png')) : canvas.toBlob(blob => resolve(blob));
      };

      image.onerror = (_) => {
        reject('Error loading SVG');
      };
    });
  };

  useEffect(() => {
    if (ogSvg) {
      setSvg(transformSvg());
    }
  }, [ogSvg, color, thickness, bg, bgColor, radius, padding, fill, fillColor]);

  useEffect(() => {
    if (svg) {
      (async () => setPreviewImage(await convertSvgToPng()))();
      (async () => setDownloadImage(await convertSvgToPng(downloadSize)))();
    } else {
      setPreviewImage(null);
      setDownloadImage(null);
    }
  }, [svg, downloadSize]);

  const setDefaults = () => {
    setBg(false);
    setBgColor('black');
    setRadius(size / 2);
    setPadding(0);
    setFill(false);
    setColor('black');
    setFillColor('black');
  }

  const reset = () => {
    if (!confirm('reset your changes?')) return;
    setDefaults();
    setSvg(ogSvg);
  }

  const remove = () => {
    if (!confirm('delete your work?')) return;
    setDefaults();
    setSvg('');
    setOgSvg('');
  }


  const downloadFile = async (type) => {
    const link = document.createElement('a');
    link.download = `icon2logo-${downloadSize}.${type}`;
    link.href = {
      png: await convertSvgToPng(downloadSize, false),
      svg: `data:image/svg+xml;base64,${btoa(transformSvg())}`,
    }[type];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  useEffect(() => {
    const handlePaste = (event) => {
      const text = (event.clipboardData || window.clipboardData).getData('text');
      if (text?.includes('<svg')) {
        setSvg(text);
        setOgSvg(text);
        window.removeEventListener('paste', handlePaste);
      }
    };

    if (!svg) {
      window.addEventListener('paste', handlePaste);
    }

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [svg]);

  return (
    <div className='w-full relative bg-muted min-h-screen flex flex-col justify-center items-center'>

      <section className='p-5'>
        <div className='flex flex-col md:flex-row gap-5 items-end justify-center'>
          <h1 className='text-5xl font-extrabold text-center shrink-0 leading-none'>
            icon to logo converter
          </h1>
          <div className='text-center md:text-left text-xs text-muted-foreground md:max-w-xs'>
            <Balancer>
              this is the only logo editor tool you'll ever need.
              fast. free. beautiful. simple.
            </Balancer>
          </div>
        </div>
      </section>

      <Separator className='max-w-2xl' />

      <section className='h-full w-full flex flex-col md:flex-row items-start justify-center p-5 gap-5 lg:gap-20'>
        <div className='min-w-sm w-full sm:w-fit'>
          {svg && (
            <div className=''>
              <div className='ml-auto w-fit flex gap-3 text-muted-foreground mb-3'>
                <RotateCcwIcon className='w-4 h-4 cursor-pointer' onClick={reset} />
                <XIcon className='w-4 h-4 cursor-pointer' onClick={remove} />
              </div>

              {previewImage && (
                <div className='flex flex-col gap-5 items-center justify-center'>
                  <img src={previewImage} alt="Preview" className='w-full max-w-[512px] max-h-[512px]' />
                  <img src={previewImage} alt="Preview" className='max-w-[128px] max-h-[128px]' />
                  <img src={previewImage} alt="Preview" className='max-w-[64px] max-h-[64px]' />
                  <img src={previewImage} alt="Preview" className='max-w-[32px] max-h-[32px]' />
                  <img src={previewImage} alt="Preview" className='max-w-[16px] max-h-[16px]' />
                </div>
              )}
            </div>
          )}

          {!svg && (
            <div className='w-full max-w-sm h-full flex items-center justify-center'>
              <div className="w-full flex flex-col gap-3">
                <Label>upload or paste an svg icon</Label>
                <Input
                  type='file'
                  onChange={handleFileChange}
                  accept=".svg"
                  className='w-full'
                />

                <div className='text-xs text-muted-foreground'>
                  <a href="https://lucide.dev/icons" className='underline' target="_blank" rel="noopener noreferrer">lucide</a>{' or '}
                  <a href="https://heroicons.com/" className='underline' target="_blank" rel="noopener noreferrer">heroicons</a>
                  {' '}are great sources.
                </div>

                <Label>or pick one example</Label>
                <div className='flex gap-3 justify-between'>
                  {[exampleSvg1, exampleSvg2, exampleSvg3, exampleSvg4, exampleSvg5].map((svg, i) => (
                    <Button
                      key={i}
                      variant='outline'
                      className='h-14'
                      onClick={() => {
                        setSvg(svg);
                        setOgSvg(svg);
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: svg }} />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <Card className='md:sticky top-5 self-auto w-full max-w-[24rem] h-fit p-5 flex flex-col gap-5'>
          <Label>icon color</Label>
          <div className='relative flex items-center'>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={disabled}
              className='rounded-r-none border-r-0'
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={disabled}
              className='rounded-none text-right !outline-none !ring-0 w-24'
            />
            <Button
              variant='outline'
              onClick={() => copyToClipboard(color)}
              disabled={disabled}
              className="border-l-0 rounded-l-none"
            >
              <CopyIcon className='w-4 h-4' />
            </Button>
          </div>

          <Label>thickness</Label>
          <Slider
            defaultValue={[0]}
            value={[thickness]}
            min={0}
            max={3}
            step={0.1}
            onValueChange={setThickness}
            disabled={disabled}
          />

          <Separator />

          <div className="flex items-center space-x-2">
            <Switch checked={fill} onCheckedChange={setFill} disabled={disabled} />
            <Label>fill</Label>
          </div>
          <div className={cn(!fill && 'opacity-50', 'relative flex items-center transition-opacity')}>
            <Input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              disabled={disabled}
              className='rounded-r-none border-r-0'
            />
            <Input
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              disabled={disabled}
              className='rounded-none text-right !outline-none !ring-0 w-24'
            />
            <Button
              variant='outline'
              onClick={() => copyToClipboard(fillColor)}
              disabled={disabled}
              className="border-l-0 rounded-l-none"
            >
              <CopyIcon className='w-4 h-4' />
            </Button>
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Switch checked={bg} onCheckedChange={setBg} disabled={disabled} />
            <Label>background</Label>
          </div>
          <div className={cn(!bg && 'opacity-50', 'relative flex items-center transition-opacity')}>
            <Input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)} disabled={disabled}
              className='rounded-r-none border-r-0'
            />
            <Input
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)} disabled={disabled}
              className='rounded-none text-right !outline-none !ring-0 w-24'
            />
            <Button
              variant='outline'
              onClick={() => copyToClipboard(bgColor)}
              disabled={disabled}
              className="border-l-0 rounded-l-none"
            >
              <CopyIcon className='w-4 h-4' />
            </Button>
          </div>

          <Label>radius</Label>
          <Slider
            defaultValue={[10]}
            value={[radius]}
            min={0}
            max={10}
            step={0.25}
            onValueChange={setRadius}
            disabled={disabled}
            className={cn(!bg && 'opacity-50', 'transition-opacity')}
          />

          <Label>padding</Label>
          <Slider
            defaultValue={[0]}
            value={[padding]}
            min={-10}
            max={10}
            step={0.5}
            onValueChange={setPadding}
            disabled={disabled}
          />

          <Separator />

          <Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger disabled={disabled} asChild>
                <Button
                  variant='secondary'
                  disabled={disabled}
                  className='w-full'
                >
                  <DownloadIcon className='w-4 h-4 mr-2' />
                  save
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => copyToClipboard(svg)} >
                  <CopyIcon className='w-4 h-4 mr-2' />
                  copy svg
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadFile('svg')}>
                  <DownloadIcon className='w-4 h-4 mr-2' />
                  download svg
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DialogTrigger asChild>
                  <DropdownMenuItem>
                    <DownloadIcon className='w-4 h-4 mr-2' />
                    export png
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <DialogContent className="overflow-y-scroll max-h-[80vh] flex flex-col gap-5 mt-5 pt-10">
              <Label>size in pixels</Label>
              <Input
                type="number" min={0} max={512}
                value={downloadSize}
                className='w-full'
                step={16}
                onChange={(e) => setDownloadSize(Math.min(512, e.target.value) || e.target.value)}
              />
              <Tabs value={downloadSize} onValueChange={setDownloadSize}>
                <TabsList className="w-full" >
                  {[16, 32, 48, 64, 128, 500].map((size) => (
                    <TabsTrigger key={size} value={size} className="w-full" >
                      {size}px
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <Separator />

              <Button
                onClick={() => downloadFile('png')}
                disabled={disabled}
              >
                <DownloadIcon className='w-4 h-4 mr-2' />
                download
              </Button>

              <Separator />

              <div className='w-full max-w-full h-[500px] max-w-screen flex items-center justify-center'>
                {downloadImage &&
                  <img src={downloadImage} alt="Preview" />
                }
              </div>
            </DialogContent>
          </Dialog>

        </Card>
      </section>
    </div>
  );
};


export default SvgIconToLogoEditor;


const copyToClipboard = (value) => {
  navigator.clipboard.writeText(value);
}


const exampleSvg1 = `<svg xmlns="http://www.w3.org/2000/svg" 
width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flower">
<path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15"/>
<circle cx="12" cy="12" r="3"/><path d="m8 16 1.5-1.5"/><path d="M14.5 9.5 16 8"/><path d="m8 8 1.5 1.5"/><path d="M14.5 14.5 16 16"/></svg>`

const exampleSvg2 = `<svg xmlns="http://www.w3.org/2000/svg" 
width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cone">
<path d="m20.9 18.55-8-15.98a1 1 0 0 0-1.8 0l-8 15.98"/><ellipse cx="12" cy="19" rx="9" ry="3"/></svg>`

const exampleSvg3 = `<svg xmlns="http://www.w3.org/2000/svg" 
fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="#000000" width="24" height="24" stroke-linecap="round" stroke-linejoin="round">
<path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>`

const exampleSvg4 = `<svg xmlns="http://www.w3.org/2000/svg" 
fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="#000000" class="w-6 h-6">
<path stroke-linecap="round" stroke-linejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67m0 0a9 9 0 01-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" /></svg>`

const exampleSvg5 = `<svg xmlns="http://www.w3.org/2000/svg" 
width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-codesandbox">
<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>`

