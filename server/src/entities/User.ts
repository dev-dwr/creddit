import { Field, ObjectType } from "type-graphql";
import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@ObjectType() //exposing this entity to graphql schema by @Field() and @ObjectType()
@Entity()
export class User extends BaseEntity {

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;
  
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn() 
  updatedAt = new Date();

  @Field()
  @Column({unique:true})
  username!: string;

  @Field()
  @Column({unique: true})
  email!: string;

  @Column()
  password!: string;


}