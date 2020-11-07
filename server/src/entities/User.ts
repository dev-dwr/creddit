import { Field, ObjectType } from "type-graphql";
import {BaseEntity, Column, CreateDateColumn,
   Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import { Post } from "./Post";
import { Updoot } from "./Updoot";

@ObjectType() //exposing this entity to graphql schema by @Field() and @ObjectType()
@Entity()
export class User extends BaseEntity {

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;
  
  @OneToMany(()=> Post, post => post.author)
  posts: Post[]

  @Field()
  @Column({unique:true})
  username!: string;

  @Field()
  @Column({unique: true})
  email!: string;

  @Column()
  password!: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn() 
  updatedAt = new Date();

  @OneToMany(()=>Updoot, (updoot) => updoot.user)
  updoots: Updoot[]

}