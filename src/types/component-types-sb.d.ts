// This file was generated by the storyblok CLI.
// DO NOT MODIFY THIS FILE BY HAND.
import type { ISbStoryData } from "storyblok";
export interface ContactStoryblok {
  intro?: string;
  employer?: string;
  employerIcon?: string;
  employerLink?: string;
  github?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  contactText?: string;
  component: "contact";
  _uid: string;
  [k: string]: any;
}

export interface GridStoryblok {
  body?: (
    | ContactStoryblok
    | GridStoryblok
    | ListingStoryblok
    | NavigationStoryblok
    | PageStoryblok
    | PostStoryblok
    | QuoteOfTheDayStoryblok
    | TeaserStoryblok
  )[];
  justifyContent?:
    | ""
    | "justify-start"
    | "justify-center"
    | "justify-end"
    | "justify-between"
    | "justify-around"
    | "justify-evenly";
  alignItems?: "" | "items-start" | "items-center" | "items-end";
  gap?: string;
  layout?: "" | "flex-row" | "flex-col";
  component: "grid";
  _uid: string;
  [k: string]: any;
}

export interface ListingStoryblok {
  perPage?: string;
  type?: ("" | "post" | "page")[];
  component: "listing";
  _uid: string;
  [k: string]: any;
}

export interface NavigationStoryblok {
  items?: (ISbStoryData<PageStoryblok> | string)[];
  component: "navigation";
  _uid: string;
  [k: string]: any;
}

export interface PageStoryblok {
  body?: (
    | ContactStoryblok
    | GridStoryblok
    | ListingStoryblok
    | NavigationStoryblok
    | PageStoryblok
    | PostStoryblok
    | QuoteOfTheDayStoryblok
    | TeaserStoryblok
  )[];
  component: "page";
  _uid: string;
  [k: string]: any;
}

export interface AssetStoryblok {
  alt: string | null;
  copyright?: string | null;
  fieldtype: "asset";
  id: number;
  filename: string | null;
  name: string;
  title: string | null;
  focus: string | null;
  meta_data?: {
    [k: string]: any;
  };
  source?: string | null;
  is_external_url?: boolean;
  is_private?: boolean;
  src?: string;
  updated_at?: string;
  width?: number | null;
  height?: number | null;
  aspect_ratio?: number | null;
  public_id?: string | null;
  content_type?: string;
  [k: string]: any;
}

export interface PostStoryblok {
  title?: string;
  date?: string;
  thumbnail?: AssetStoryblok;
  tags?: ("" | "life" | "code" | "travels")[];
  content?: string;
  component: "post";
  _uid: string;
  [k: string]: any;
}

export interface QuoteOfTheDayStoryblok {
  component: "quote_of_the_day";
  _uid: string;
  [k: string]: any;
}

export interface TeaserStoryblok {
  headline?: string;
  description?: string;
  verticalAlign?: "" | "items-start" | "items-center" | "items-end";
  horizontalAlign?: "" | "justify-start" | "justify-center" | "justify-end";
  layout?: "" | "flex-row" | "flex-col" | "flex-row-reverse";
  gap: string;
  component: "teaser";
  _uid: string;
  [k: string]: any;
}
